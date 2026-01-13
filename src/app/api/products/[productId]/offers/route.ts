// src/app/api/products/[productId]/offers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country") ?? "RO";

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Fetch product with related listings
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        Listing: {
          where: {
            inStock: true,
            url: {
              not: null,
            },
          },
          orderBy: {
            price: "asc",
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { product: null, offers: [] },
        { status: 404 }
      );
    }

    // Map listings to offers
    const offers = product.Listing.map((listing) => ({
      id: listing.id,
      storeName: listing.storeName,
      price: listing.price,
      currency: listing.currency,
      productUrl: listing.url || "",
      shippingInfo: listing.shippingCost
        ? `Shipping: ${listing.shippingCost} ${listing.currency}`
        : listing.deliveryTimeDays
        ? `Delivery: ${listing.deliveryTimeDays} days`
        : null,
      badge: listing.fastDelivery || listing.isFastDelivery
        ? "Fast Delivery"
        : listing.rating && listing.rating >= 4.5
        ? "Top Rated"
        : null,
    }));

    // Calculate min price
    const minPrice =
      offers.length > 0
        ? Math.min(...offers.map((offer) => offer.price))
        : null;

    const response = {
      product: {
        id: product.id,
        title: product.displayName || product.name,
        imageUrl: product.imageUrl || product.thumbnailUrl,
        minPrice,
        currency: offers[0]?.currency || null,
      },
      offers,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching product offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch product offers" },
      { status: 500 }
    );
  }
}
