// src/app/api/products/[productId]/offers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
    // IMPORTANT: use the actual field and relation names from schema.prisma
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        Listing: true, // the real relation name from schema
      },
    });

    if (!product) {
      return NextResponse.json(
        { product: null, offers: [] },
        { status: 404 }
      );
    }

    const offers = product.Listing.map((l: any) => ({
      id: l.id,
      storeName: l.storeName,
      price: l.price,
      currency: l.currency,
      productUrl: l.url,
      shippingInfo: l.shippingCost
        ? `Shipping: ${l.shippingCost} ${l.currency}`
        : l.deliveryTimeDays
        ? `Delivery: ${l.deliveryTimeDays} days`
        : null,
      badge: l.fastDelivery || l.isFastDelivery
        ? "Fast Delivery"
        : l.rating && l.rating >= 4.5
        ? "Top Rated"
        : null,
    }));

    const minPrice =
      offers.length > 0 ? Math.min(...offers.map((o: any) => o.price)) : null;

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.displayName || product.name,
        imageUrl: product.imageUrl || product.thumbnailUrl,
        minPrice,
        currency: offers[0]?.currency ?? null,
      },
      offers,
    });
  } catch (err) {
    console.error("Error loading product offers", err);
    return NextResponse.json(
      { error: "Failed to load product offers" },
      { status: 500 }
    );
  }
}
