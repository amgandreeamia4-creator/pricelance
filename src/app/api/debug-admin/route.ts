// src/app/api/debug-admin/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (nodeEnv === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const adminSecret = process.env.ADMIN_SECRET ?? null;

  return NextResponse.json({
    nodeEnv,
    hasAdminSecret: !!adminSecret,
    adminSecretMasked:
      adminSecret && adminSecret.length > 8
        ? `${adminSecret.slice(0, 4)}...${adminSecret.slice(-4)}`
        : adminSecret,
  });
}
