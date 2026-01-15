import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Dedicated query for eBay deals without any location filter
    const ebayListings = await prisma.listing.findMany({
      where: {
        OR: [
          { storeName: { contains: 'eBay', mode: 'insensitive' } },
          { affiliateProvider: { contains: 'ebay', mode: 'insensitive' } },
        ],
        inStock: true,
      },
      orderBy: { price: 'asc' },
      take: 8,
    });

    // Get product IDs to fetch product info
    const productIds = ebayListings.map(listing => listing.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        displayName: true,
        brand: true,
        imageUrl: true,
        category: true,
      },
    });

    // Create product lookup map
    const productMap = new Map(products.map(p => [p.id, p]));

    // Transform to response format
    const deals = ebayListings.map((listing: any) => {
      const product = productMap.get(listing.productId);
      return {
        id: listing.id,
        storeName: listing.storeName,
        price: listing.price,
        currency: listing.currency,
        url: listing.url,
        imageUrl: listing.imageUrl,
        fastDelivery: listing.fastDelivery || listing.isFastDelivery,
        deliveryTimeDays: listing.deliveryTimeDays || listing.estimatedDeliveryDays || listing.deliveryDays,
        shippingCost: listing.shippingCost,
        product: product ? {
          id: product.id,
          name: product.name,
          displayName: product.displayName,
          brand: product.brand,
          imageUrl: product.imageUrl,
          category: product.category,
        } : null,
      };
    }).filter(deal => deal.product); // Only include deals with valid products

    return NextResponse.json({
      deals,
      total: deals.length,
    });
  } catch (error) {
    console.error('Error fetching eBay deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eBay deals' },
      { status: 500 }
    );
  }
}
