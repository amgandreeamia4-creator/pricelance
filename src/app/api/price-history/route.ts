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
// Response contract (enhanced with trend and fallback):
// - On success (HTTP 200):
//   {
//     ok: true,
//     productId: string,
//     points: Array<{
//       date: string;           // ISO date
//       price: number;
//       currency: string;
//       storeName?: string;
//       isSynthetic?: boolean; // true when using fallback current price
//     }>,
//     trend?: {
//       direction: 'up' | 'down' | 'flat' | 'none';
//       percentChange?: number;
//       startPrice?: number;
//       endPrice?: number;
//       firstDate?: string;
//       lastDate?: string;
//       numPoints: number;
//     }
//   }
// - On validation error (missing productId):
//   HTTP 400 with { ok: false, error: string, points: [] }
// - On unexpected server / DB error:
//   HTTP 500 with { ok: false, error: string, points: [] }
//
// Notes:
// - Primary: ProductPriceHistory rows for historical data
// - Fallback: Current best price from listings when no history exists
// - Trend analysis: Direction and percent change when 2+ points available
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isListingFromDisabledNetwork } from "@/config/affiliateNetworks";

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

    // Try to get historical price data first
    const history = await prisma.productPriceHistory.findMany({
      where: { productId },
      orderBy: { date: "asc" },
      take: 90, // safety cap – more than enough for ~12 months of monthly points
    });

    if (history.length > 0) {
      // We have historical data - use it
      const points = history.map((h) => ({
        date:
          h.date instanceof Date
            ? h.date.toISOString().slice(0, 10)
            : new Date(h.date as any).toISOString().slice(0, 10),
        price: typeof h.price === "number" ? h.price : Number(h.price),
        currency: h.currency ?? "RON",
        isSynthetic: false,
      }));

      // Compute trend if we have 2+ points
      let trend;
      if (points.length >= 2) {
        const startPrice = points[0].price;
        const endPrice = points[points.length - 1].price;
        const percentChange = ((endPrice - startPrice) / startPrice) * 100;
        
        let direction: 'up' | 'down' | 'flat';
        if (percentChange > 3) {
          direction = 'up';
        } else if (percentChange < -3) {
          direction = 'down';
        } else {
          direction = 'flat';
        }

        trend = {
          direction,
          percentChange: Math.round(percentChange * 10) / 10, // Round to 1 decimal
          startPrice,
          endPrice,
          firstDate: points[0].date,
          lastDate: points[points.length - 1].date,
          numPoints: points.length,
        };
      } else if (points.length === 1) {
        trend = {
          direction: 'none' as const,
          numPoints: 1,
        };
      }

      return NextResponse.json({
        ok: true,
        productId,
        points,
        trend,
      });
    }

    // No historical data - fallback to current best price from listings
    const listings = await prisma.listing.findMany({
      where: { productId },
    });

    // Filter out disabled affiliate networks
    const validListings = listings.filter(listing => !isListingFromDisabledNetwork(listing));

    if (validListings.length === 0) {
      // No listings either
      return NextResponse.json({
        ok: true,
        productId,
        points: [],
        trend: { direction: 'none' as const, numPoints: 0 },
      });
    }

    // Find cheapest listing
    const bestListing = validListings.reduce((best, current) => 
      current.price < best.price ? current : best
    );

    const syntheticPoint = {
      date: new Date().toISOString().slice(0, 10),
      price: typeof bestListing.price === "number" ? bestListing.price : Number(bestListing.price),
      currency: bestListing.currency || "RON",
      storeName: bestListing.storeName,
      isSynthetic: true,
    };

    return NextResponse.json({
      ok: true,
      productId,
      points: [syntheticPoint],
      trend: { direction: 'none' as const, numPoints: 1 },
    });
  } catch (error) {
    console.error("Failed to load price history", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load price history", points: [] },
      { status: 500 }
    );
  }
}
