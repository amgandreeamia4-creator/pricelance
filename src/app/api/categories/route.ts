// src/app/api/categories/route.ts
// Returns distinct non-null categories from the Product table

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

// Fallback categories when database is not available
const FALLBACK_CATEGORIES = [
  "Laptops",
  "Phones",
  "Tablets",
  "Headphones",
  "Monitors",
  "Keyboards",
  "Mice",
  "Speakers",
  "Cameras",
  "Gaming",
  "Accessories",
];

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

      // Query distinct categories from Product
      const results = await prisma.product.findMany({
        select: { category: true },
        distinct: ["category"],
      });

      // Filter out null and empty strings, then sort alphabetically (case-insensitive)
      const categories = results
        .map((r) => r.category)
        .filter(
          (cat): cat is string => typeof cat === "string" && cat.trim() !== "",
        )
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

      // If no categories found in database, use fallback
      if (categories.length === 0) {
        console.warn(
          "[/api/categories] No categories found in database, using fallback",
        );
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
      return NextResponse.json(
        { categories: FALLBACK_CATEGORIES },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("[/api/categories] Unexpected error:", error);

    // Return fallback categories instead of 500 error
    return NextResponse.json(
      { categories: FALLBACK_CATEGORIES },
      { status: 200 },
    );
  }
}
