import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint for future Banggood affiliate integration.
 * Currently disabled in this preview build.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Banggood debug endpoint is currently disabled. This route is a placeholder for future implementation.",
    },
    { status: 501 }
  );
}
