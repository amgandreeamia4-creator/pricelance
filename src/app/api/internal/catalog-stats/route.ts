// src/app/api/internal/catalog-stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkInternalAuth } from "@/lib/internalAuth";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

function inferProviderFromProductId(
  productId: string
): "dummyjson" | "demo" | "seed" | "unknown" {
  if (typeof productId === "string" && productId.startsWith("dummyjson-")) {
    return "dummyjson";
  }

  if (typeof productId === "string" && productId.startsWith("demo-")) {
    return "demo";
  }

  if (typeof productId === "string" && productId.length > 0) {
    return "seed";
  }

  return "unknown";
}

export async function GET(req: NextRequest) {
  if ((process.env.NODE_ENV ?? "development") === "production") {
    return NextResponse.json(
      { ok: false, error: "Not available in production" },
      { status: 404 },
    );
  }

  const authError = checkInternalAuth(req);
  if (authError) return authError;

  try {
    const [productCount, listingCount] = await Promise.all([
      prisma.product.count(),
      prisma.listing.count(),
    ]);

    const products = await prisma.product.findMany({
      select: {
        id: true,
        category: true,
        listings: {
          select: {
            price: true,
          },
        },
      },
    });

    const categoryMap = new Map<
      string,
      {
        productCount: number;
        listingCount: number;
        totalPrice: number;
        minPrice: number;
        maxPrice: number;
      }
    >();

    const providerMap = new Map<
      string,
      {
        productCount: number;
        listingCount: number;
      }
    >();

    for (const p of products) {
      const cat = (p.category ?? "Uncategorized").trim() || "Uncategorized";
      const entry =
        categoryMap.get(cat) ?? {
          productCount: 0,
          listingCount: 0,
          totalPrice: 0,
          minPrice: Number.POSITIVE_INFINITY,
          maxPrice: Number.NEGATIVE_INFINITY,
        };

      entry.productCount += 1;

      for (const l of p.listings) {
        const price = l.price;
        if (typeof price === "number" && !Number.isNaN(price)) {
          entry.listingCount += 1;
          entry.totalPrice += price;
          if (price < entry.minPrice) entry.minPrice = price;
          if (price > entry.maxPrice) entry.maxPrice = price;
        }
      }

      categoryMap.set(cat, entry);

      const provider = inferProviderFromProductId(p.id);
      const providerStats =
        providerMap.get(provider) ?? {
          productCount: 0,
          listingCount: 0,
        };

      providerStats.productCount += 1;
      providerStats.listingCount += p.listings.length;

      providerMap.set(provider, providerStats);
    }

    const categories = Array.from(categoryMap.entries()).map(
      ([category, stats]) => {
        const hasListings = stats.listingCount > 0;
        const avgPrice = hasListings
          ? stats.totalPrice / stats.listingCount
          : null;

        return {
          category,
          productCount: stats.productCount,
          listingCount: stats.listingCount,
          minPrice:
            hasListings && Number.isFinite(stats.minPrice)
              ? stats.minPrice
              : null,
          maxPrice:
            hasListings && Number.isFinite(stats.maxPrice)
              ? stats.maxPrice
              : null,
          avgPrice,
        };
      }
    );

    categories.sort((a, b) => b.productCount - a.productCount);

    const providers = Array.from(providerMap.entries()).map(
      ([provider, stats]) => ({
        provider,
        productCount: stats.productCount,
        listingCount: stats.listingCount,
      })
    );

    providers.sort((a, b) => b.productCount - a.productCount);

    return NextResponse.json(
      {
        ok: true,
        totals: {
          productCount,
          listingCount,
        },
        categories,
        providers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[internal/catalog-stats] GET error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
