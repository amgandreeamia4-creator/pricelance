// src/app/api/products/[productId]/offers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isListingFromDisabledNetwork } from "@/config/affiliateNetworks";
import type { ListingResponse } from "@/lib/searchProducts";

type ProductOffersResponse = {
  product: {
    id: string;
    name: string;
    displayName: string | null;
    brand: string | null;
    imageUrl: string | null;
    category: string | null;
  } | null;
  listings: ListingResponse[];
};

export async function GET(
  req: Request,
  // use a loose type so Next 16 is happy
  { params }: any
) {
  const productId = params?.productId as string | undefined;
  if (!productId) {
    return NextResponse.json(
      { error: "Missing productId" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Fetch the single product without listings (same as searchProducts pattern)
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { product: null, listings: [] },
        { status: 404 }
      );
    }

    // Step 2: Fetch listings separately (same as searchProducts pattern)
    const rawListings = await prisma.listing.findMany({
      where: { productId: product.id },
    });

    // Step 3: Filter listings based on disabled affiliate networks (same as searchProducts)
    const filterListingsForVisibility = (listings: any[]) => {
      return listings.filter((l) =>
        !isListingFromDisabledNetwork({
          affiliateProvider: l.affiliateProvider,
          affiliateProgram: l.affiliateProgram,
          url: l.url,
        })
      );
    };

    const visibleListings = filterListingsForVisibility(rawListings);

    // Step 4: Map listings to ListingResponse type (same as searchProducts)
    const listings: ListingResponse[] = visibleListings.map(
      (l: any): ListingResponse => ({
        id: l.id,
        storeId: l.storeId ?? null,
        storeName: l.storeName ?? null,
        price: l.price,
        currency: l.currency ?? null,
        url: l.url ?? l.productUrl ?? l.affiliateUrl ?? null,
        affiliateProvider: l.affiliateProvider ?? null,
        source: l.source ?? null,
        fastDelivery: l.fastDelivery ?? null,
        imageUrl: l.imageUrl ?? null,
      })
    );

    const response: ProductOffersResponse = {
      product: {
        id: product.id,
        name: product.name,
        displayName: product.displayName,
        brand: product.brand,
        imageUrl: product.imageUrl,
        category: product.category ?? null,
      },
      listings,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Error loading product offers", err);
    return NextResponse.json(
      { error: "Failed to load product offers" },
      { status: 500 }
    );
  }
}
