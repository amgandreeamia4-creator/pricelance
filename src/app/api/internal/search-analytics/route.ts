// src/app/api/internal/search-analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { checkInternalAuth } from "@/lib/internalAuth";
import { computeTopQueries } from "@/lib/searchAnalytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if ((process.env.NODE_ENV ?? "development") === "production") {
    return NextResponse.json(
      { ok: false, error: "Not available in production" },
      { status: 404 },
    );
  }

  const authError = checkInternalAuth(req);
  if (authError) return authError;

  try {
    const recent = await prisma.savedSearch.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const topQueries = computeTopQueries(recent);

    return NextResponse.json(
      {
        ok: true,
        totalSavedSearches: recent.length,
        topQueries,
        recentSearches: recent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[search-analytics] GET error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
