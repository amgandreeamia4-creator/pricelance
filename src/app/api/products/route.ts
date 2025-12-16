// src/app/api/products/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const limit = Number(searchParams.get("limit") || 20);
    const category = searchParams.get("category")?.trim() || "";

    // Defensive: if q is missing or empty, return empty products with 200
    if (!q) {
      return NextResponse.json({
        ok: true,
        count: 0,
        q: "",
        products: [],
      });
    }

    console.log("🔎 Searching products:", { q, limit, category });

    let products = [];
    try {
      const where: any = {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      };

      if (category) {
        where.category = category;
      }

      products = await prisma.product.findMany({
        where,
        include: {
          listings: true,
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
    } catch (dbError: any) {
      console.error("❌ Database query failed:", dbError?.message || dbError);
      // Return empty results instead of crashing
      return NextResponse.json({
        ok: true,
        count: 0,
        q,
        products: [],
        warning: "Database query failed, returning empty results",
      });
    }

    return NextResponse.json({
      ok: true,
      count: products.length,
      q,
      products,
    });
  } catch (error: any) {
    console.error("❌ Failed to fetch products:", error?.message || error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Unknown error", products: [] },
      { status: 500 }
    );
  }
}