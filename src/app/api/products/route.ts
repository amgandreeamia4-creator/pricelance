// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logSearchEvent } from "@/lib/searchAnalytics";
import { CANONICAL_CATEGORIES, isValidCategory } from "@/config/categories";
import { isGoodListing } from "@/lib/listingUtils";

export const dynamic = "force-dynamic";

const FAST_SHIPPING_DAYS = 3;

type ListingResponse = {
  id: string;
  storeId?: string;
  storeName: string;
  storeLogoUrl?: string | null;
  price: number;
  currency: string;
  url?: string | null;
  fastDelivery?: boolean | null;
  deliveryDays?: number | null;
  inStock?: boolean | null;
  deliveryTimeDays?: number | null;
  source?: string | null;
  affiliateProvider?: string | null;
};

type ProductWithListings = {
  id: string;
  name: string;
  displayName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  listings: ListingResponse[];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const q = (searchParams.get("q") ?? "").trim();
    const category = (searchParams.get("category") ?? "").trim();
    const store = (searchParams.get("store") ?? "").trim();
    const fastOnly = searchParams.get("fastOnly") === "true";
    const includeLegacy = searchParams.get("includeLegacy") === "true";

    const shouldFilterByCategory = category && category !== "all";
    const isUnknownCategory =
      shouldFilterByCategory && !isValidCategory(category);

    if (isUnknownCategory) {
      return NextResponse.json({
        products: [],
        warning: `Unknown category "${category}". Valid categories: ${CANONICAL_CATEGORIES.join(
          ", "
        )}`,
      });
    }

    if (!q) {
      return NextResponse.json({ products: [] });
    }

    console.log("🔎 [/api/products] Searching:", {
      q,
      category: category || "(all)",
      store: store || "(all)",
      fastOnly,
      includeLegacy,
    });

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (shouldFilterByCategory) {
      where.category = category;
    }

    let dbProducts: {
      id: string;
      name: string;
      displayName: string | null;
      brand: string | null;
      imageUrl: string | null;
      thumbnailUrl: string | null;
      listings: any[];
    }[] = [];

    try {
      dbProducts = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          displayName: true,
          brand: true,
          imageUrl: true,
          thumbnailUrl: true,
          listings: true,
        },
        take: 100,
        orderBy: { updatedAt: "desc" },
      });
    } catch (dbError) {
      console.error("❌ [/api/products] Database query failed:", dbError);
      return NextResponse.json({
        products: [],
        warning: "Database query failed, returning empty results",
      });
    }

    const shaped: ProductWithListings[] = [];

    for (const p of dbProducts) {
      const rawListings = Array.isArray(p.listings) ? p.listings : [];

      const filteredBySource = rawListings.filter((l: any) => {
        if (includeLegacy) return true;
        const src = l.source;
        return src === "manual" || src === "sheet" || src === "affiliate";
      });

      let listings: ListingResponse[] = filteredBySource.map((l: any) => ({
        id: String(l.id),
        storeId: l.storeName ?? undefined,
        storeName: l.storeName ?? "",
        storeLogoUrl: l.storeLogoUrl ?? null,
        price: Number(l.price),
        currency: l.currency ?? "RON",
        url: l.url ?? null,
        fastDelivery: l.fastDelivery ?? l.isFastDelivery ?? null,
        deliveryDays: l.deliveryDays ?? l.estimatedDeliveryDays ?? null,
        inStock: l.inStock ?? null,
        deliveryTimeDays: l.deliveryTimeDays ?? null,
        source: l.source ?? null,
        affiliateProvider: l.affiliateProvider ?? null,
      }));

      listings = listings.filter((l) => isGoodListing(l));

      if (store && store !== "all") {
        listings = listings.filter(
          (l) => l.storeId === store || l.storeName === store
        );
      }

      if (fastOnly) {
        listings = listings.filter((l) => {
          if (l.deliveryTimeDays != null) {
            return l.deliveryTimeDays <= FAST_SHIPPING_DAYS;
          }
          if (l.deliveryDays != null) {
            return l.deliveryDays <= FAST_SHIPPING_DAYS;
          }
          if (typeof l.fastDelivery === "boolean") {
            return l.fastDelivery;
          }
          return false;
        });
      }

      if (listings.length === 0) {
        continue;
      }

      shaped.push({
        id: String(p.id),
        name: p.name,
        displayName: p.displayName ?? null,
        brand: p.brand ?? null,
        imageUrl: p.imageUrl ?? p.thumbnailUrl ?? null, // ✅ Ensure image gets through
        listings,
      });
    }

    const resultCount = shaped.length;

    logSearchEvent({ query: q, resultCount }).catch((err) => {
      console.error("[/api/products] Failed to log search event:", err);
    });

    return NextResponse.json({ products: shaped }, { status: 200 });
  } catch (error) {
    console.error("❌ [/api/products] Unexpected error:", error);
    return NextResponse.json(
      { products: [], error: "Failed to load products" },
      { status: 500 }
    );
  }
}