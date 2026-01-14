import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  console.log("[/api/products-smoke] GET start");
  
  try {
    const products = await prisma.product.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        displayName: true,
        category: true,
        brand: true,
        imageUrl: true,
      },
    });

    return NextResponse.json({ 
      ok: true, 
      count: products.length, 
      products 
    }, { status: 200 });
  } catch (error) {
    console.error("[/api/products-smoke] GET error", error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
