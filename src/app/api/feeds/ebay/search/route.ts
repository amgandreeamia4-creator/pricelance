// app/api/feeds/ebay/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { searchEbayItems } from "@/lib/ebayClient";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limitParam = searchParams.get("limit");

    if (!q.trim()) {
      return NextResponse.json(
        { error: "Missing q parameter" },
        { status: 400 }
      );
    }

    const limit = limitParam ? Number(limitParam) : undefined;

    const result = await searchEbayItems(q, { limit });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("eBay feed error:", err);
    return NextResponse.json(
      { error: "eBay feed error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
