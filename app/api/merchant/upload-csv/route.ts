import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Merchant CSV upload API is currently disabled in this preview build. This endpoint is a placeholder for future implementation.",
    },
    { status: 501 }
  );
}
