import { NextRequest, NextResponse } from "next/server";

/**
 * Merchant CSV upload API is disabled in this preview build.
 * Placeholder implementation.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Merchant CSV upload API is currently disabled in this preview build. This endpoint is a placeholder for future implementation.",
    },
    { status: 501 }
  );
}