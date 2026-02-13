import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAdminToken } from "@/lib/adminAuth";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/merchants
 * Fetch all merchants.
 */
export async function GET(req: NextRequest) {
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json(
      { ok: false, error: authError.error },
      { status: authError.status }
    );
  }

  try {
    const merchants = await prisma.merchant.findMany({
      orderBy: { storeName: "asc" },
    });

    return NextResponse.json({ ok: true, merchants });
  } catch (error) {
    console.error("[api/admin/merchants] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/merchants
 * Create a new merchant.
 */
export async function POST(req: NextRequest) {
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json(
      { ok: false, error: authError.error },
      { status: authError.status }
    );
  }

  try {
    const body = await req.json();
    const { storeName, name, website } = body;

    if (!storeName) {
      return NextResponse.json(
        { ok: false, error: "storeName is required" },
        { status: 400 }
      );
    }

    const merchant = await (prisma.merchant.create as any)({
      data: {
        id: randomUUID(),
        storeName,
        name: name || null,
        website: website || null,
      },
    });

    return NextResponse.json({ ok: true, merchant });
  } catch (error) {
    console.error("[api/admin/merchants] POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
