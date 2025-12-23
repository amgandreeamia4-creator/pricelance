// src/app/api/debug-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkInternalAuth } from "@/lib/internalAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  // Preserve existing behavior: never expose this in production.
  if (nodeEnv === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const authError = checkInternalAuth(req);
  if (authError) return authError;

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
