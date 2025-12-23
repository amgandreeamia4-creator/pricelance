// src/app/api/admin/import-affiliate-fake/route.ts
// =============================================================================
// FAKE AFFILIATE IMPORT - Test/Demo Only
// =============================================================================
//
// This route is for testing the affiliate import architecture ONLY.
// It does NOT connect to any real affiliate network.
//
// Purpose:
// - Test the full affiliate import flow end-to-end
// - Validate CSV → adapter → importNormalizedListings pipeline
// - Test affiliate metadata fields (affiliateProvider, merchantOriginalId)
//
// Security:
// - Protected by Basic Auth middleware (/api/admin/*)
// - Requires ENABLE_AFFILIATE_IMPORT=true env var
// - Optionally requires x-import-secret header if IMPORT_SECRET is set
//
// Usage:
// POST /api/admin/import-affiliate-fake
// Body: { "csv": "affiliate_product_name,affiliate_brand,..." }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { fakeAffiliateAdapter } from "@/lib/affiliates/fakeAffiliateAdapter";
import { importNormalizedListings } from "@/lib/importService";
import { validateAdminToken } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/import-affiliate-fake
 * Test endpoint for affiliate import architecture.
 * Body: { csv: string }
 */
export async function POST(req: NextRequest) {
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status }
    );
  }

  try {
    // Guard 1: Check if affiliate import is enabled
    const enabled = process.env.ENABLE_AFFILIATE_IMPORT === "true";
    if (!enabled) {
      return NextResponse.json(
        {
          error: "Affiliate import is disabled. Set ENABLE_AFFILIATE_IMPORT=true to enable.",
        },
        { status: 403 }
      );
    }

    // Guard 2: Check import secret if configured
    const importSecret = process.env.IMPORT_SECRET;
    if (importSecret) {
      const providedSecret = req.headers.get("x-import-secret");
      if (providedSecret !== importSecret) {
        return NextResponse.json(
          { error: "Invalid or missing x-import-secret header" },
          { status: 401 }
        );
      }
    }

    // Parse JSON body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    const raw = body as Record<string, unknown>;
    const csv = typeof raw?.csv === "string" ? raw.csv : "";

    if (!csv.trim()) {
      return NextResponse.json(
        { error: "csv field is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    console.log("[admin/import-affiliate-fake] Starting fake affiliate import");

    try {
      // Step 1: Normalize CSV using fake affiliate adapter
      const normalized = fakeAffiliateAdapter.normalize(csv);

      if (normalized.length === 0) {
        return NextResponse.json(
          { error: "No valid rows found in CSV" },
          { status: 400 }
        );
      }

      // Step 2: Import using core pipeline with affiliate metadata
      const summary = await importNormalizedListings(normalized, {
        source: "affiliate",
        defaultCountryCode: "RO",
        affiliateProvider: "fake",
        affiliateProgram: "fake_test_program",
        startRowNumber: 2,
      });

      console.log("[admin/import-affiliate-fake] Import completed:", {
        rowsProcessed: normalized.length,
        summary,
      });

      return NextResponse.json({ summary }, { status: 200 });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process affiliate CSV";

      const isBadInput =
        message.startsWith("CSV ") ||
        message.startsWith("Missing required columns") ||
        message.includes("header row") ||
        message.includes("CSV content is empty");

      console.error("[admin/import-affiliate-fake] Import error:", err);
      return NextResponse.json(
        { error: message },
        { status: isBadInput ? 400 : 500 }
      );
    }
  } catch (error) {
    console.error("[admin/import-affiliate-fake] POST error:", error);
    return NextResponse.json(
      { error: "Failed to process affiliate import" },
      { status: 500 }
    );
  }
}
