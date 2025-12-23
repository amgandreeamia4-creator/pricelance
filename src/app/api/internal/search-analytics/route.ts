// src/app/api/internal/search-analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkInternalAuth } from "@/lib/internalAuth";
import { getSearchAnalyticsSummary } from "@/lib/searchAnalytics";

export const dynamic = "force-dynamic";

// Safe empty response shape for errors
function errorResponse(message: string) {
  return {
    ok: false,
    error: message,
    range: null,
    totals: {
      totalSearches: 0,
      uniqueQueries: 0,
      avgResultCount: null,
    },
    topQueries: [],
    zeroResultQueries: [],
  };
}

/**
 * Real internal search analytics summary endpoint.
 *
 * This route returns a JSON payload containing search analytics summary data.
 * Response shape is always consistent:
 * - ok: boolean
 * - error?: string (when ok is false)
 * - range, totals, topQueries, zeroResultQueries (always present, may be empty)
 */
export async function GET(req: NextRequest) {
  try {
    const authError = checkInternalAuth(req);
    if (authError) return authError;

    const { searchParams } = req.nextUrl;
    const rawDays = searchParams.get("days");
    const parsedDays = rawDays ? Number(rawDays) : NaN;
    const days = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 7;

    const summary = await getSearchAnalyticsSummary(days);

    // Ensure the response always has the expected shape
    return NextResponse.json(
      {
        ok: summary?.ok ?? true,
        range: summary?.range ?? null,
        totals: summary?.totals ?? {
          totalSearches: 0,
          uniqueQueries: 0,
          avgResultCount: null,
        },
        topQueries: Array.isArray(summary?.topQueries) ? summary.topQueries : [],
        zeroResultQueries: Array.isArray(summary?.zeroResultQueries)
          ? summary.zeroResultQueries
          : [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[internal/search-analytics] Unexpected error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(errorResponse("Failed to load search analytics"), {
      status: 500,
    });
  }
}