import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Merchant logout API is currently disabled in this preview build. This endpoint is a placeholder for future implementation.",
    },
    { status: 501 }
  );
}