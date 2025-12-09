// src/app/api/internal/db-health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Simple helper to check the internal API key header.
 */
function checkInternalKey(req: NextRequest): boolean {
  const headerKey = req.headers.get("x-internal-key");
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) {
    return false;
  }

  return headerKey === expectedKey;
}

/**
 * GET /api/internal/db-health
 *
 * Health check endpoint to verify Prisma database connectivity.
 * Returns counts of all main tables and database URL.
 */
export async function GET(req: NextRequest) {
  if (!checkInternalKey(req)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: invalid internal key" },
      { status: 401 }
    );
  }

  try {
    // Run all counts in parallel for efficiency
    const [productCount, listingCount, savedSearchCount, favoriteCount] = await Promise.all([
      prisma.product.count(),
      prisma.listing.count(),
      prisma.savedSearch.count(),
      prisma.favorite.count(),
    ]);

    const dbUrl = process.env.DATABASE_URL ?? "missing";

    return NextResponse.json({
      ok: true,
      dbUrl,
      productCount,
      listingCount,
      savedSearchCount,
      favoriteCount,
    });
  } catch (error) {
    console.error("[db-health] Error checking DB health:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
