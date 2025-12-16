// src/app/api/internal/search-analytics/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Stub internal search analytics endpoint.
 *
 * For now, this route just returns a static payload so that
 * production builds succeed even if analytics are not wired.
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    ok: true,
    items: [],
    note: "Search analytics are disabled in this build.",
  });
}