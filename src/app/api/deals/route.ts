// @ts-nocheck
// src/app/api/deals/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { computeDiscountPercent } from "@/lib/dealsUtils";
import { isDemoProduct } from "@/lib/demoFilter";
import { checkRateLimit } from "@/lib/rateLimit";
import { getNetworkFilter, AFFILIATE_FLAGS, shouldHideListing } from "@/config/affiliates";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

const MIN_HISTORY_POINTS = 3;
const MIN_DISCOUNT_PERCENT = 15;

function inferProviderFromProductId(
  productId: string
): "dummyjson" | "demo" | "seed" | "unknown" {
  if (productId.startsWith("dummyjson-")) return "dummyjson";
  if (productId.startsWith("demo-")) return "demo";
  if (productId.length > 0) return "seed";
  return "unknown";
}

type DealListing = {
  id: string;
  storeName: string;
  url: string | null;
  price: number;
  currency: string;
  shippingCost: number;
  fastDelivery: boolean;
};

type Deal = {
  productId: string;
  productName: string;
  category: string | null;
  brand: string | null;
  provider: string | null;
  currentPrice: number;
  avgHistoricalPrice: number;
  discountPercent: number;
  bestListing: DealListing;
};

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const rate = checkRateLimit(ip, 30, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many requests. Please try again shortly.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)),
          },
        },
      );
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    let limit = 20;
    if (limitParam) {
      const parsed = Number(limitParam);
      if (!Number.isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 50);
      }
    }

    // Apply network filtering to exclude disabled networks
    const networkFilter = getNetworkFilter();
    const whereClause = Object.keys(networkFilter).length > 0 ? {
      Listing: {
        some: networkFilter,
      },
    } : undefined;

    const products = await prisma.product.findMany({
      include: {
        Listing: true,
        ProductPriceHistory: true,
      },
      where: whereClause,
    });

    const deals: Deal[] = [];

    let withHistoryCount = 0;

    for (const p of products) {
      // Require at least one listing
      if (!p.Listing || p.Listing.length === 0) continue;

      // Filter out disabled networks from listings
      const filteredListings = (p.Listing as any[]).filter((l: any) => {
        // Additional safety filter: exclude disabled networks using affiliate fields
        if (shouldHideListing(l)) {
          return false;
        }
        return true;
      });

      if (filteredListings.length === 0) continue;

      // Skip demo/DummyJSON products - they should not appear in deals
      if (isDemoProduct({ id: p.id, brand: p.brand, listings: filteredListings })) {
        continue;
      }

      const validHistory = (p.ProductPriceHistory as any[]).filter((h: any) => h.price > 0);
      if (validHistory.length < MIN_HISTORY_POINTS) continue;

      withHistoryCount++;

      // Optionally could sort and take last N points; for now, use all valid points
      const totalHistorical = validHistory.reduce(
        (sum, h) => sum + h.price,
        0
      );
      const avgHistoricalPrice =
        validHistory.length > 0 ? totalHistorical / validHistory.length : 0;

      if (!(avgHistoricalPrice > 0)) continue;

      const validListings = filteredListings.filter(
        (l: any) => typeof l.price === "number" && l.price > 0
      );
      if (validListings.length === 0) continue;

      const sorted = [...validListings].sort((a, b) => a.price - b.price);
      const bestListingRecord = sorted[0];
      const currentPrice = bestListingRecord.price;

      if (!(currentPrice > 0)) continue;

      let discountPercent = computeDiscountPercent(
        currentPrice,
        avgHistoricalPrice
      );

      if (discountPercent == null) continue;

      // Clamp absurd values
      if (discountPercent > 90) {
        discountPercent = 90;
      }

      if (discountPercent < MIN_DISCOUNT_PERCENT) continue;

      const provider = inferProviderFromProductId(p.id);

      const deal: Deal = {
        productId: p.id,
        productName: (p as any).displayName ?? p.name,
        category: p.category,
        brand: p.brand,
        provider,
        currentPrice,
        avgHistoricalPrice,
        discountPercent,
        bestListing: {
          id: bestListingRecord.id,
          storeName: bestListingRecord.storeName,
          url: bestListingRecord.url ?? null,
          price: bestListingRecord.price,
          currency: bestListingRecord.currency,
          shippingCost:
            typeof (bestListingRecord as any).shippingCost === "number"
              ? (bestListingRecord as any).shippingCost
              : 0,
          fastDelivery: !!(
            bestListingRecord.fastDelivery ??
            (bestListingRecord as any).isFastDelivery
          ),
        },
      };

      deals.push(deal);
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[deals] history-based deals",
        "candidates:",
        products.length,
        "withHistory:",
        withHistoryCount,
        "finalDeals:",
        deals.length
      );
    }

    deals.sort((a, b) => b.discountPercent - a.discountPercent);

    const limitedDeals = deals.slice(0, limit);

    return NextResponse.json(
      {
        ok: true,
        count: limitedDeals.length,
        deals: limitedDeals,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[deals] GET error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
