// src/app/api/debug-admin/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV ?? null,
    hasAdminSecret: !!process.env.ADMIN_SECRET,
    adminSecret: process.env.ADMIN_SECRET ?? null,
  });
}
