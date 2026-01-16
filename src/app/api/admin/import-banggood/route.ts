// src/app/api/admin/import-banggood/route.ts
// Banggood admin import API route

import { NextRequest, NextResponse } from "next/server";
import { importNormalizedListings } from "@/lib/importService";
import { fetchBanggoodProducts } from "@/lib/affiliates/banggood";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/import-banggood
 * Import products from Banggood affiliate API
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin token validation
    // Reference: other /api/admin routes for token checking pattern
    
    const body = await request.json();
    const { categoryId, page, pageSize } = body;
    
    // Validate input parameters
    if (typeof categoryId !== 'string' && categoryId !== undefined) {
      return NextResponse.json(
        { ok: false, message: "categoryId must be a string" },
        { status: 400 }
      );
    }
    
    if (typeof page !== 'number' && page !== undefined) {
      return NextResponse.json(
        { ok: false, message: "page must be a number" },
        { status: 400 }
      );
    }
    
    if (typeof pageSize !== 'number' && pageSize !== undefined) {
      return NextResponse.json(
        { ok: false, message: "pageSize must be a number" },
        { status: 400 }
      );
    }

    // Fetch products from Banggood
    const listings = await fetchBanggoodProducts({
      categoryId,
      page,
      pageSize,
    });

    // Import normalized listings
    const summary = await importNormalizedListings(listings, {
      source: "affiliate",
      affiliateProvider: "banggood",
      affiliateProgram: "banggood",
    });

    return NextResponse.json(summary, { status: 200 });
    
  } catch (error) {
    console.error("[import-banggood] POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error during Banggood import";
    
    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    );
  }
}
