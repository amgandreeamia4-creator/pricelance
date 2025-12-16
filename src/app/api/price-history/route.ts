// src/app/api/price-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId")?.trim() || "";

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "Missing productId", points: [] },
        { status: 400 }
      );
    }

    const history = await prisma.productPriceHistory.findMany({
      where: { productId },
      orderBy: { date: "asc" },
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
