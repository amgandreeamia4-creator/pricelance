// src/app/api/internal/db-health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkInternalAuth } from "@/lib/internalAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/internal/db-health
 *
 * Health check endpoint to verify Prisma database connectivity.
 * Returns counts of all main tables and database URL.
 * 
 * IMPORTANT: SQLite with file:./prisma/dev.db will NOT work on Vercel
 * because Vercel has a read-only filesystem. For production, you need
 * a cloud database like Supabase, Neon, PlanetScale, or Turso.
 */
export async function GET(req: NextRequest) {
  const authError = checkInternalAuth(req);
  if (authError) return authError;

  const dbUrl = process.env.DATABASE_URL ?? "missing";
  const nodeEnv = process.env.NODE_ENV ?? "unknown";
  const isVercel = !!process.env.VERCEL;
  const isSqlite = dbUrl.startsWith("file:");

  // Warn about SQLite on Vercel
  if (isVercel && isSqlite) {
    console.warn("[db-health] WARNING: SQLite with file: URL will not work on Vercel. Use a cloud database.");
    return NextResponse.json({
      ok: false,
      error: "SQLite file-based database is not compatible with Vercel serverless. Please configure a cloud database (Supabase, Neon, PlanetScale, or Turso).",
      dbUrl,
      nodeEnv,
      isVercel,
      isSqlite,
      recommendation: "Set DATABASE_URL to a PostgreSQL or Turso connection string in Vercel environment variables.",
    }, { status: 500 });
  }

  try {
    // Run all counts in parallel for efficiency
    const [productCount, listingCount, savedSearchCount, favoriteCount] = await Promise.all([
      prisma.product.count(),
      prisma.listing.count(),
      prisma.savedSearch.count(),
      prisma.favorite.count(),
    ]);

    return NextResponse.json({
      ok: true,
      dbUrl: dbUrl.includes("@") ? dbUrl.replace(/:[^:@]+@/, ":****@") : dbUrl,
      nodeEnv,
      isVercel,
      isSqlite,
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
        dbUrl: dbUrl.includes("@") ? dbUrl.replace(/:[^:@]+@/, ":****@") : dbUrl,
        nodeEnv,
        isVercel,
        isSqlite,
        hint: isSqlite && isVercel 
          ? "SQLite file-based database is not compatible with Vercel. Use a cloud database."
          : "Check that DATABASE_URL is correctly configured and the database is accessible.",
      },
      { status: 500 }
    );
  }
}
