// src/app/api/products/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ok: true, products });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { ok: false, error: "Could not fetch products" },
      { status: 500 }
    );
  }
}