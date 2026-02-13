import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAdminToken } from "@/lib/adminAuth";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/merchant-feeds
 * List existing MerchantFeed records.
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
    const feeds = await (prisma as any).merchantFeed.findMany({
      include: {
        merchant: {
          select: {
            storeName: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, feeds });
  } catch (error) {
    console.error("[api/admin/merchant-feeds] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/merchant-feeds
 * Create a new MerchantFeed.
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
    const { merchantId, name, sourceType, sourceSlug } = body;

    if (!merchantId || !name || !sourceType || !sourceSlug) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: merchantId, name, sourceType, sourceSlug" },
        { status: 400 }
      );
    }

    const feed = await (prisma as any).merchantFeed.create({
      data: {
        id: randomUUID(),
        merchantId,
        name,
        sourceType,
        sourceSlug,
      },
    });

    return NextResponse.json({ ok: true, feed });
  } catch (error) {
    console.error("[api/admin/merchant-feeds] POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
