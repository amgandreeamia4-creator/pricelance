import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Dev/admin endpoint to inspect how many products have 0/1/2+ offers,
 * and how that breaks down per category.
 *
 * WARNING: This is for debugging/analytics only. Do not expose it in UI.
 */
export async function GET(req: NextRequest) {
  try {
    // Total products in DB
    const totalProducts = await prisma.product.count();

    // Group listings by productId, counting only those with a non-null price
    const groupedByProduct = await prisma.listing.groupBy({
      by: ["productId"],
      _count: {
        _all: true,
      },
    });

    const productsWithOffers = groupedByProduct.length;
    const entries = groupedByProduct as any[];
    const countOf = (g: any) => (g?._count?._all ?? 0) as number;

    const with1Offer = entries.filter((g) => countOf(g) === 1).length;
    const with2PlusOffers = entries.filter((g) => countOf(g) >= 2).length;

    const byOfferCount = {
      totalProducts,
      with0Offers: totalProducts - productsWithOffers,
      with1Offer,
      with2PlusOffers,
    };

    // Fetch categories for the products that have at least 1 priced listing
    const productIds = groupedByProduct.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        category: true,
      },
    });

    // Build a map productId -> category (fallback "UNKNOWN" when missing)
    const productCategoryMap = new Map<string, string>();
    for (const p of products) {
      const cat = (p.category ?? "UNKNOWN").trim() || "UNKNOWN";
      productCategoryMap.set(p.id, cat);
    }

    // Per-category stats:
    //  - productsWithOffers: at least 1 priced listing
    //  - with2PlusOffers:    at least 2 priced listings
    const categoryStats: Record<
      string,
      { productsWithOffers: number; with2PlusOffers: number }
    > = {};

    for (const group of groupedByProduct as any[]) {
      const productId = group.productId as string;
      const cat = productCategoryMap.get(productId) ?? "UNKNOWN";

      if (!categoryStats[cat]) {
        categoryStats[cat] = {
          productsWithOffers: 0,
          with2PlusOffers: 0,
        };
      }

      categoryStats[cat].productsWithOffers += 1;
      if ((group?._count?._all ?? 0) >= 2) {
        categoryStats[cat].with2PlusOffers += 1;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        byOfferCount,
        categoryStats,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/admin/offer-stats] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
