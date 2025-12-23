// src/app/api/products/route.ts
// Primary endpoint for product search - queries Supabase Postgres via Prisma.
// Response shape: { products: ProductWithListings[] }
//
// Pre-affiliate hardening: Only returns listings that are "good listings":
// - url is non-null and non-empty
// - price is a finite positive number (> 0)
// Products with no qualifying listings are excluded from results.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logSearchEvent } from "@/lib/searchAnalytics";
import { CANONICAL_CATEGORIES, isValidCategory } from "@/config/categories";
import { isGoodListing } from "@/lib/listingUtils";

export const dynamic = "force-dynamic";

const FAST_SHIPPING_DAYS = 3;

// Type definitions for the response shape expected by page.tsx
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

    // Category validation: empty or "all" means no filter; unknown returns warning
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

    // If q is missing or empty, return empty products with 200
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

    // 1) Build Prisma where-filter for Product (search + category)
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

    // 2) Query products + listings from Prisma (DB is source of truth)
    let dbProducts: Awaited<
      ReturnType<typeof prisma.product.findMany<{ include: { listings: true } }>>
    > = [];

    try {
      dbProducts = await prisma.product.findMany({
        where,
        include: {
          listings: true,
        },
        take: 100, // safety cap
        orderBy: { updatedAt: "desc" },
      });
    } catch (dbError) {
      console.error(
        "❌ [/api/products] Database query failed:",
        dbError instanceof Error ? dbError.message : dbError
      );
      return NextResponse.json({
        products: [],
        warning: "Database query failed, returning empty results",
      });
    }

    // 3) Convert Prisma results to the exact shape the frontend expects
    //    and apply store/fastOnly filters at the listing level
    const shaped: ProductWithListings[] = [];

    for (const p of dbProducts) {
      const rawListings = Array.isArray(p.listings) ? p.listings : [];

      // ⬇⬇⬇ CHANGED: include affiliate listings by default
      const filteredBySource = rawListings.filter((l: any) => {
        if (includeLegacy) return true;
        const src = (l as any).source;
        return src === "manual" || src === "sheet" || src === "affiliate";
      });
      // ⬆⬆⬆

      // Map each listing to the expected response shape
      let listings: ListingResponse[] = filteredBySource.map((l) => ({
        id: String(l.id),
        storeId: l.storeName ?? undefined, // Use storeName as storeId for filtering
        storeName: l.storeName ?? "",
        storeLogoUrl: l.storeLogoUrl ?? null,
        price: Number(l.price),
        currency: l.currency ?? "RON",
        url: l.url ?? null,
        fastDelivery: l.fastDelivery ?? l.isFastDelivery ?? null,
        deliveryDays: l.deliveryDays ?? l.estimatedDeliveryDays ?? null,
        inStock: l.inStock ?? null,
        deliveryTimeDays: l.deliveryTimeDays ?? null,
      }));

      // Pre-affiliate hardening: Filter to "good listings" only
      // Uses centralized isGoodListing() from listingUtils.ts
      listings = listings.filter((l) => isGoodListing(l));

      // Apply store filter
      if (store && store !== "all") {
        listings = listings.filter(
          (l) => l.storeId === store || l.storeName === store
        );
      }

      // Apply fast shipping filter
      if (fastOnly) {
        listings = listings.filter((l) => {
          // Check deliveryTimeDays first
          if (l.deliveryTimeDays != null) {
            return l.deliveryTimeDays <= FAST_SHIPPING_DAYS;
          }
          // Then check deliveryDays
          if (l.deliveryDays != null) {
            return l.deliveryDays <= FAST_SHIPPING_DAYS;
          }
          // Finally check fastDelivery boolean
          if (typeof l.fastDelivery === "boolean") {
            return l.fastDelivery;
          }
          return false;
        });
      }

      // Drop products that have no listings after filtering
      if (listings.length === 0) {
        continue;
      }

      shaped.push({
        id: String(p.id),
        name: p.name,
        displayName: p.displayName ?? null,
        brand: p.brand ?? null,
        imageUrl: p.imageUrl ?? p.thumbnailUrl ?? null,
        listings,
      });
    }

    const resultCount = shaped.length;

    // Fire-and-forget logging of search analytics into SearchLog.
    // Never block or affect the main search response.
    logSearchEvent({ query: q, resultCount }).catch((err) => {
      console.error("[/api/products] Failed to log search event:", err);
    });

    return NextResponse.json({ products: shaped }, { status: 200 });
  } catch (error) {
    console.error(
      "❌ [/api/products] Unexpected error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { products: [], error: "Failed to load products" },
      { status: 500 }
    );
  }
}