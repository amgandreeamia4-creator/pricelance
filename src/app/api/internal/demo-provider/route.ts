// src/app/api/internal/demo-provider/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ingestProducts } from "@/lib/ingestService";
import { checkInternalAuth } from "@/lib/internalAuth";

// Demo products in the ingest format
const DEMO_PRODUCTS = [
  {
    id: "demo-laptop-1",
    name: 'Demo Ultrabook 13"',
    displayName: 'Demo Ultrabook 13 (16GB, 512GB SSD)',
    description:
      "Lightweight and powerful ultrabook for everyday use. Demo product from internal provider.",
    category: "Laptops",
    brand: "DemoBrand",
    imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce6965c2c6",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1611186871348-b1ce6965c2c6?w=200",
    listings: [
      {
        id: "demo-laptop-1-techstore",
        storeName: "TechStore",
        url: "https://example.com/demo-laptop-1",
        imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce6965c2c6",
        price: 899.99,
        currency: "USD",
        shippingCost: 9.99,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online",
        inStock: true,
        rating: 4.7,
        reviewCount: 120,
      },
    ],
    priceHistory: [
      {
        month: "2025-01",
        averagePrice: 949.99,
        currency: "USD",
        storeName: "TechStore",
      },
      {
        month: "2025-02",
        averagePrice: 929.99,
        currency: "USD",
        storeName: "TechStore",
      },
      {
        month: "2025-03",
        averagePrice: 899.99,
        currency: "USD",
        storeName: "TechStore",
      },
    ],
  },
  {
    id: "demo-headphones-1",
    name: "Demo Pro Headphones",
    displayName: "Demo Pro Wireless Headphones (Noise Cancelling)",
    description:
      "Premium wireless headphones with active noise cancellation. Demo product from internal provider.",
    category: "Audio",
    brand: "DemoAudio",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
    listings: [
      {
        id: "demo-headphones-1-audiostore",
        storeName: "AudioWorld",
        url: "https://example.com/demo-headphones-1",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        price: 199.99,
        currency: "USD",
        shippingCost: 0,
        deliveryTimeDays: 2,
        fastDelivery: true,
        location: "Online",
        inStock: true,
        rating: 4.8,
        reviewCount: 245,
      },
      {
        id: "demo-headphones-1-techmart",
        storeName: "TechMart",
        url: "https://example.com/demo-headphones-1-alt",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        price: 179.99,
        currency: "USD",
        shippingCost: 4.99,
        deliveryTimeDays: 1,
        fastDelivery: true,
        location: "New York, NY",
        inStock: true,
        rating: 4.6,
        reviewCount: 89,
      },
    ],
    priceHistory: [
      {
        month: "2024-11",
        averagePrice: 249.99,
        currency: "USD",
        storeName: "AudioWorld",
      },
      {
        month: "2024-12",
        averagePrice: 229.99,
        currency: "USD",
        storeName: "AudioWorld",
      },
      {
        month: "2025-01",
        averagePrice: 219.99,
        currency: "USD",
        storeName: "AudioWorld",
      },
      {
        month: "2025-02",
        averagePrice: 199.99,
        currency: "USD",
        storeName: "AudioWorld",
      },
    ],
  },
];

export async function GET(req: NextRequest) {
  if ((process.env.NODE_ENV ?? "development") === "production") {
    return NextResponse.json(
      { ok: false, error: "Not available in production" },
      { status: 404 },
    );
  }

  if (process.env.ENABLE_DEMO_PROVIDERS !== "true") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Demo ingestion is disabled. Set ENABLE_DEMO_PROVIDERS=true to run this endpoint intentionally.",
      },
      { status: 403 },
    );
  }

  const authError = checkInternalAuth(req);
  if (authError) return authError;

  try {
    const result = await ingestProducts(DEMO_PRODUCTS);

    return NextResponse.json(
      {
        ok: true,
        ingested: result.count,
        productIds: result.productIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Demo provider failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        ingested: 0,
      },
      { status: 500 }
    );
  }
}
