// src/app/api/products/route.ts
import { prisma } from "@/lib/db"; // Adjust if your db file path is different
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("📦 Fetching products from database...");

    const products = await prisma.product.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    console.log("✅ Products fetched:", products);

    return NextResponse.json({ ok: true, products });
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