// app/api/categories/route.ts
// Returns distinct non-null categories from the Product table

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Query distinct categories from Product
    const results = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    // Filter out null and empty strings, then sort alphabetically (case-insensitive)
    const categories = results
      .map((r) => r.category)
      .filter((cat): cat is string => typeof cat === "string" && cat.trim() !== "")
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("[/api/categories] Error fetching categories:", error);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
