// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isListingFromDisabledNetwork } from "@/config/affiliateNetworks";

type ListingResponse = {
  id: string;
  storeId: string | null;
  storeName: string | null;
  price: number | null;
  currency: string | null;
  url: string | null;
  affiliateProvider: string | null;
  source: string | null;
  fastDelivery: boolean | null;
  imageUrl: string | null;
};

type ProductResponse = {
  id: string;
  name: string;
  displayName: string | null;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
  listings: ListingResponse[];
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the product by ID with its listings
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Fetch listings for this product
    const dbListings = await prisma.listing.findMany({
      where: { productId: id },
    });

    // Filter listings based on disabled affiliate networks
    const visibleListings = dbListings.filter((l) =>
      !isListingFromDisabledNetwork({
        affiliateProvider: l.affiliateProvider,
        affiliateProgram: l.affiliateProgram,
        url: l.url,
      })
    );

    // Map to the response format
    const productResponse: ProductResponse = {
      id: product.id,
      name: product.name,
      displayName: product.displayName,
      brand: product.brand,
      imageUrl: product.imageUrl,
      category: product.category ?? null,
      listings: visibleListings.map(
        (l): ListingResponse => ({
          id: l.id,
          storeId: null, // Listing model doesn't have storeId field
          storeName: l.storeName ?? null,
          price: l.price,
          currency: l.currency ?? null,
          url: l.url ?? null,
          affiliateProvider: l.affiliateProvider ?? null,
          source: l.source ?? null,
          fastDelivery: l.fastDelivery ?? null,
          imageUrl: l.imageUrl ?? null,
        })
      ),
    };

    return NextResponse.json({
      ok: true,
      product: productResponse,
    });
  } catch (err) {
    console.error("[GET /api/products/[id]] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
