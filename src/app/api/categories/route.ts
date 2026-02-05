// src/app/api/categories/route.ts
// Returns distinct non-null categories from the Product table (database only)

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { CATEGORY_LABELS } from "@/config/categories";

export const dynamic = "force-dynamic";

// Fallback categories when database is not available
const FALLBACK_CATEGORIES = [
  "Laptops",
  "Phones",
  "Tablets",
  "Headphones & Audio",
  "Monitors",
  "Keyboards & Mice",
  "TV & Display",
  "Phone Cases & Protection",
  "Personal Care",
  "Wellness & Supplements",
  "Gifts & Lifestyle",
  "Books & Media",
  "Toys & Games",
  "Home & Garden",
  "Kitchen",
  "Small Appliances",
  "Smartwatches",
];

// Normalize old database values to canonical labels
const CATEGORY_NORMALIZATION: Record<string, string> = {
  "Keyboards & Mouse": "Keyboards & Mice",
  "Headphones": "Headphones & Audio",
  "Mice": "Keyboards & Mice",
  "Keyboards": "Keyboards & Mice",
  "Speakers": "Headphones & Audio",
};

function normalizeCategory(cat: string | null): string | null {
  if (!cat) return null;
  return CATEGORY_NORMALIZATION[cat] || cat;
}

export async function GET() {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.warn(
        "[/api/categories] DATABASE_URL not configured, using fallback categories",
      );
      return NextResponse.json(
        { categories: FALLBACK_CATEGORIES },
        { status: 200 },
      );
    }

    // Initialize Prisma client
    const prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
    });

    try {
      // Test database connection
      await prisma.$connect();

      // Query distinct categories from Product table
      const results = await prisma.product.findMany({
        select: { category: true },
        distinct: ["category"],
      });

      console.info("[/api/categories] Raw DB categories:", {
        count: results.length,
        sample: results.slice(0, 5).map((r: any) => r.category),
      });

      // Normalize, filter out null and empty strings, then sort alphabetically (case-insensitive)
      const categories = results
        .map((r: any) => normalizeCategory(r.category))
        .filter(
          (cat: any): cat is string =>
            typeof cat === "string" && cat.trim() !== "",
        )
        .filter((cat, idx, arr) => arr.indexOf(cat) === idx) // Remove duplicates
        .sort((a: string, b: string) =>
          a.toLowerCase().localeCompare(b.toLowerCase()),
        );

      console.info("[/api/categories] Final categories:", {
        count: categories.length,
        categories: categories,
      });

      // If no categories found in database, use fallback
      if (categories.length === 0) {
        console.warn(
          "[/api/categories] No categories found in database, using fallback",
        );
        await prisma.$disconnect();
        return NextResponse.json(
          { categories: FALLBACK_CATEGORIES },
          { status: 200 },
        );
      }

      await prisma.$disconnect();
      return NextResponse.json({ categories }, { status: 200 });
    } catch (dbError) {
      console.error(
        "[/api/categories] Database connection/query failed:",
        dbError,
      );
      await prisma.$disconnect();

      // Return fallback categories instead of error
      console.warn("[/api/categories] Using fallback due to DB error");
      return NextResponse.json(
        { categories: FALLBACK_CATEGORIES },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("[/api/categories] Unexpected error:", error);

    // Return fallback categories instead of 500 error
    console.warn("[/api/categories] Using fallback due to unexpected error");
    return NextResponse.json(
      { categories: FALLBACK_CATEGORIES },
      { status: 200 },
    );
  }
}
