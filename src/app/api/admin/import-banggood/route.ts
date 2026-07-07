// src/app/api/admin/import-banggood/route.ts
// Banggood admin import API route

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ingestionQueue, ingestionQueueEvents } from "@/lib/ingestionQueue";
import { validateAdminToken } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = validateAdminToken(request.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json({ ok: false, message: authError.error }, { status: authError.status });
  }

  try {
    const body = await request.json();
    const { categoryId, page, pageSize, merchantFeedId } = body as {
      categoryId?: string;
      page?: number;
      pageSize?: number;
      merchantFeedId?: string;
    };

    if (categoryId !== undefined && typeof categoryId !== "string") {
      return NextResponse.json(
        { ok: false, message: "categoryId must be a string" },
        { status: 400 },
      );
    }
    if (page !== undefined && typeof page !== "number") {
      return NextResponse.json(
        { ok: false, message: "page must be a number" },
        { status: 400 },
      );
    }
    if (pageSize !== undefined && typeof pageSize !== "number") {
      return NextResponse.json(
        { ok: false, message: "pageSize must be a number" },
        { status: 400 },
      );
    }

    let merchantId: string | undefined;
    if (merchantFeedId) {
      const feed = await (prisma as any).merchantFeed.findUnique({
        where: { id: merchantFeedId },
        select: { merchantId: true },
      });

      if (!feed) {
        return NextResponse.json(
          { ok: false, message: "Merchant feed not found" },
          { status: 400 },
        );
      }

      merchantId = feed.merchantId;
    }

    const job = await ingestionQueue.add("affiliate_import", {
      provider: "banggood",
      merchantFeedId: merchantFeedId || undefined,
      merchantId,
      affiliateProgram: "banggood",
      categoryId,
      page,
      pageSize,
    });
    const jobResult = await job.waitUntilFinished(ingestionQueueEvents);

    return NextResponse.json((jobResult as any).summary, { status: 200 });
  } catch (error) {
    console.error("[import-banggood] POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error during Banggood import";

    return NextResponse.json(
      { ok: false, message },
      { status: 500 },
    );
  }
}
