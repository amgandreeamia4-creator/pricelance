// src/app/api/admin/import-profitshare/route.ts
// =============================================================================
// PROFITSHARE IMPORT ENDPOINT
// =============================================================================
//
// This endpoint handles Profitshare.ro CSV feed imports.
// It uses the ProfitshareAdapter to normalize data and tags all listings
// with network: 'PROFITSHARE' for proper filtering.
//
// Security:
// - Protected by Basic Auth middleware (/api/admin/*)
// - Requires ENABLE_AFFILIATE_IMPORT=true env var
// - Optionally requires x-import-secret header if IMPORT_SECRET is set
//
// Usage:
// POST /api/admin/import-profitshare
// Body: { "csv": "profitshare_csv_content" }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { profitshareAdapter } from "@/lib/affiliates/profitshareAdapter";
import { importNormalizedListings } from "@/lib/importService";
import { validateAdminToken } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/import-profitshare
 * Import Profitshare CSV feed with network tagging.
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

    console.log("[admin/import-profitshare] Starting Profitshare import");

    try {
      // Step 1: Normalize CSV using Profitshare adapter
      const normalized = profitshareAdapter.normalize(csv);

      if (normalized.length === 0) {
        return NextResponse.json(
          { error: "No valid rows found in Profitshare CSV" },
          { status: 400 }
        );
      }

      // Step 2: Import using core pipeline with Profitshare network tagging
      const summary = await importNormalizedListings(normalized, {
        source: "affiliate",
        defaultCountryCode: "RO",
        affiliateProvider: "profitshare",
        affiliateProgram: "profitshare_ro",
        network: "PROFITSHARE",
        startRowNumber: 2,
      });

      console.log("[admin/import-profitshare] Import completed:", {
        rowsProcessed: normalized.length,
        summary,
      });

      return NextResponse.json({ summary }, { status: 200 });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process Profitshare CSV";

      const isBadInput =
        message.startsWith("CSV ") ||
        message.startsWith("Missing required columns") ||
        message.includes("header row") ||
        message.includes("CSV content is empty");

      console.error("[admin/import-profitshare] Import error:", err);
      return NextResponse.json(
        { error: message },
        { status: isBadInput ? 400 : 500 }
      );
    }
  } catch (error) {
    console.error("[admin/import-profitshare] POST error:", error);
    return NextResponse.json(
      { error: "Failed to process Profitshare import" },
      { status: 500 }
    );
  }
}
