// src/app/api/search/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserId, attachUserIdCookie } from "@/lib/userIdentity";
import { getSearchAnalyticsForUser } from "@/lib/searchAnalytics";

export const dynamic = "force-dynamic";

// GET /api/search/summary
// Public summary of search analytics for the current anonymous user.
export async function GET(req: NextRequest) {
  const { userId, shouldSetCookie } = getOrCreateUserId(req);

  try {
    const { topQueries, recentSearches } = await getSearchAnalyticsForUser(
      userId
    );

    let res: NextResponse;
    res = NextResponse.json(
      {
        ok: true,
        topQueries,
        recentSearches: recentSearches.map((s) => ({
          query: s.query,
          createdAt: s.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );

    if (shouldSetCookie) {
      res = attachUserIdCookie(res, userId);
    }

    return res;
  } catch (error) {
    // Graceful degradation: return empty analytics with dbUnavailable flag
    // instead of a 500 error that would break the UI
    console.error("[search-summary] GET error (DB likely unavailable):", error instanceof Error ? error.message : String(error));
    
    const fallbackRes = NextResponse.json(
      {
        ok: true,
        topQueries: [] as { query: string; count: number }[],
        recentSearches: [] as { query: string; createdAt: string }[],
        dbUnavailable: true,
      },
      { status: 200 }
    );

    if (shouldSetCookie) {
      return attachUserIdCookie(fallbackRes, userId);
    }

    return fallbackRes;
  }
}
