// src/app/api/internal/cleanup-demo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkInternalAuth } from "@/lib/internalAuth";
import { isDemoProduct } from "@/lib/demoFilter";

export const dynamic = "force-dynamic";

/**
 * GET /api/internal/cleanup-demo
 *
 * Preview which demo/static products would be deleted.
 * Does NOT actually delete anything - use POST for that.
 */
export async function GET(req: NextRequest) {
  const authError = checkInternalAuth(req);
  if (authError) return authError;

  try {
    const allProducts = await prisma.product.findMany({
      include: {
        listings: {
          select: { id: true, storeName: true, url: true },
        },
      },
    });

    const demoProducts = allProducts.filter((p) =>
      isDemoProduct({
        id: p.id,
        brand: p.brand,
        listings: p.listings,
      })
    );

    const productIds = demoProducts.map((p) => p.id);

    // Already guaranteed non-production by early return above
    console.log("[cleanup-demo][GET] Found demo/static products:", productIds.length);

    return NextResponse.json(
      {
        ok: true,
        preview: true,
        message: "Use POST to actually delete these products.",
        demoProductCount: productIds.length,
        productIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[cleanup-demo][GET] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Preview failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/internal/cleanup-demo
 *
 * Actually delete all demo/static products and their related data.
 * Protected by INTERNAL_API_KEY header.
 */
export async function POST(req: NextRequest) {
  const authError = checkInternalAuth(req);
  if (authError) return authError;

  try {
    const allProducts = await prisma.product.findMany({
      include: {
        listings: {
          select: { id: true, storeName: true, url: true },
        },
      },
    });

    const demoProducts = allProducts.filter((p) =>
      isDemoProduct({
        id: p.id,
        brand: p.brand,
        listings: p.listings,
      })
    );

    const productIds = demoProducts.map((p) => p.id);

    if (productIds.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          deleted: { products: 0, listings: 0, priceHistoryPoints: 0, favorites: 0 },
          deletedProducts: 0,
          deletedListings: 0,
          deletedPriceHistory: 0,
          deletedFavorites: 0,
          productIds: [],
        },
        { status: 200 }
      );
    }

    // Already guaranteed non-production by early return above
    console.log("[cleanup-demo][POST] Deleting:", productIds.length, "products");

    // Delete in correct order to respect foreign key constraints
    // 1. Delete favorites first (no cascade)
    const deletedFavorites = await prisma.favorite.deleteMany({
      where: { productId: { in: productIds } },
    });

    // 2. Delete price history
    const deletedPriceHistory = await prisma.productPriceHistory.deleteMany({
      where: { productId: { in: productIds } },
    });

    // 3. Delete listings
    const deletedListings = await prisma.listing.deleteMany({
      where: { productId: { in: productIds } },
    });

    // 4. Finally delete products
    const deletedProducts = await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    });

    // Already guaranteed non-production by early return above
    console.log("[cleanup-demo][POST] Deleted:", deletedProducts.count, "products");

    return NextResponse.json(
      {
        ok: true,
        deleted: {
          products: deletedProducts.count,
          listings: deletedListings.count,
          priceHistoryPoints: deletedPriceHistory.count,
          favorites: deletedFavorites.count,
        },
        deletedProducts: deletedProducts.count,
        deletedListings: deletedListings.count,
        deletedPriceHistory: deletedPriceHistory.count,
        deletedFavorites: deletedFavorites.count,
        productIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[cleanup-demo][POST] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Cleanup failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
