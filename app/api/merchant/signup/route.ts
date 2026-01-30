import { NextRequest, NextResponse } from "next/server";

/**
 * Merchant signup API is disabled in this preview build.
 * This is a placeholder so the project compiles on Vercel.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Merchant signup API is currently disabled in this preview build. This endpoint is a placeholder for future implementation.",
    },
    { status: 501 }
  );
}