// src/app/api/price-history/route.ts
//
// Price history data model (Prisma)
// - ProductPriceHistory: one row per product and date, seeded from prisma/seed.ts
//   - Fields we care about here: productId (FK to Product), date (DateTime), price (Float), currency (String)
//   - Linked only to Product via productId; not per-listing or per-store in this route.
//
// Request contract (GET /api/price-history)
// - Method: GET
// - Query params (from src/app/page.tsx):
//   - productId: string (required) – the Product.id for which we want the history.
//
// Response contract (consumed by PriceTrendChart in src/components/PriceTrendChart.tsx)
// - On success (HTTP 200):
//   {
//     ok: true,
//     productId: string,
//     points: Array<{
//       date: string;      // ISO-like YYYY-MM-DD (no time component)
//       price: number;     // numeric price as stored in ProductPriceHistory.price
//       currency: string;  // currency code from ProductPriceHistory.currency
//     }>
//   }
// - On validation error (missing productId):
//   HTTP 400 with { ok: false, error: string, points: [] }
// - On unexpected server / DB error:
//   HTTP 500 with { ok: false, error: string, points: [] }
//
// Notes:
// - We stay fully grounded in ProductPriceHistory rows – no synthetic or demo data.
// - We order points oldest → newest by date and apply a simple safety cap on rows.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId")?.trim() || "";

    if (!productId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing productId. I can only load price history when a product is selected.",
          points: [],
        },
        { status: 400 }
      );
    }

    const history = await prisma.productPriceHistory.findMany({
      where: { productId },
      orderBy: { date: "asc" },
      take: 90, // safety cap – more than enough for ~12 months of monthly points
    });

    const points = history.map((h) => ({
      date:
        h.date instanceof Date
          ? h.date.toISOString().slice(0, 10)
          : new Date(h.date as any).toISOString().slice(0, 10),
      price: typeof h.price === "number" ? h.price : Number(h.price),
      currency: h.currency ?? "USD",
    }));

    return NextResponse.json({
      ok: true,
      productId,
      points,
    });
  } catch (error) {
    console.error("Failed to load price history", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load price history", points: [] },
      { status: 500 }
    );
  }
}
