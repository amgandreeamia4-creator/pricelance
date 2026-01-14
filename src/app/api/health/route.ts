import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  console.log("[/api/health] GET");
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() }, { status: 200 });
}
