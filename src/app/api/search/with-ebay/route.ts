// app/api/search/with-ebay/route.ts

import { NextRequest, NextResponse } from "next/server";
import { searchDbProducts, type ProductResponse } from "@/lib/searchProducts";
import { fetchEbayItems } from "@/lib/ebayFeed";

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
    const resolvedLimit = limit || 20;

    // Run both searches in parallel
    const [dbResult, ebayItems] = await Promise.all([
      searchDbProducts({
        query: q,
        perPage: resolvedLimit,
        sort: "relevance",
      }),
      fetchEbayItems(q, resolvedLimit),
    ]);

    return NextResponse.json({
      query: q,
      limit: resolvedLimit,
      db: {
        products: dbResult.products,
        total: dbResult.total,
        page: dbResult.page,
        perPage: dbResult.perPage,
      },
      ebay: {
        total: ebayItems.length,
        items: ebayItems,
      },
    }, { status: 200 });
  } catch (err: any) {
    console.error("combined search error", err);
    return NextResponse.json(
      { error: "Combined search error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
