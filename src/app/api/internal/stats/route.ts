// src/app/api/internal/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkInternalAuth } from "@/lib/internalAuth";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if ((process.env.NODE_ENV ?? "development") === "production") {
    return NextResponse.json(
      { ok: false, error: "Not available in production" },
      { status: 404 },
    );
  }

  const authError = checkInternalAuth(req);
  if (authError) return authError;

  try {
    const [totalProducts, totalListings, totalPriceHistoryPoints, categoryGroups] =
      await Promise.all([
        prisma.product.count(),
        prisma.listing.count(),
        prisma.productPriceHistory.count(),
        prisma.product.groupBy({
          by: ["category"],
          _count: { _all: true },
        }),
      ]);

    return NextResponse.json(
      {
        ok: true,
        products: totalProducts,
        listings: totalListings,
        priceHistoryPoints: totalPriceHistoryPoints,
        categories: categoryGroups.map((c) => ({
          name: c.category,
          count: c._count._all,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[internal/stats] Error generating stats:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
