export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: [],
    note: "Contact message persistence is disabled in this release.",
  });
}
