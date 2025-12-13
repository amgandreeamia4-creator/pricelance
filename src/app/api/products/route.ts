// src/app/api/products/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("📦 Fetching products (with listings) from database...");

    const products = await prisma.product.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },

      // ✅ Ensures we don't return products that have no listings,
      // which would force bestPrice fields to null.
      where: {
        listings: {
          some: {},
        },
      },

      include: {
        listings: {
          orderBy: { price: "asc" }, // best price first
          take: 5, // keep response light
        },
      },
    });

    const normalized = products.map((p) => {
      const best = p.listings?.[0] ?? null;

      return {
        // Product fields
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        category: p.category,
        brand: p.brand,
        imageUrl: p.imageUrl,
        thumbnailUrl: p.thumbnailUrl,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,

        // Derived MVP fields (from best listing)
        price: best?.price ?? null,
        currency: best?.currency ?? null,
        storeName: best?.storeName ?? null,
        inStock: best?.inStock ?? null,
        url: best?.url ?? null,

        // Offers for future compare UI
        listings: p.listings,
      };
    });

    return NextResponse.json({ ok: true, products: normalized });
  } catch (error) {
    console.error("❌ Failed to fetch products:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not fetch products",
      },
      { status: 500 }
    );
  }
}