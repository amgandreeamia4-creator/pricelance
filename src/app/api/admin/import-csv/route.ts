// src/app/api/admin/import-csv/route.ts
// CSV bulk import for Products + Listings (file upload)

import { NextRequest, NextResponse } from "next/server";
import { googleSheetAdapter } from "@/lib/affiliates/googleSheet";
import { importNormalizedListings } from "@/lib/importService";
import { validateAdminToken } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/import-csv
 * Bulk import products and listings from an uploaded CSV file.
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
    const { searchParams } = new URL(req.url);
    const validateUrls = searchParams.get("validateUrls") === "true";

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Please upload a CSV file." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV file" },
        { status: 400 }
      );
    }

    const content = await file.text();

    if (!content.trim()) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      );
    }

    try {
      const normalized = googleSheetAdapter.normalize(content);
      const summary = await importNormalizedListings(normalized, {
        source: "sheet",
        defaultCountryCode: "RO",
        startRowNumber: 2,
        validateUrls,
      });
      return NextResponse.json({ summary }, { status: 200 });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process CSV";

      // Treat obvious CSV/header issues as bad input (400), others as server errors (500)
      const isBadInput =
        message.startsWith("CSV ") ||
        message.startsWith("Missing required columns") ||
        message.includes("header row") ||
        message.includes("CSV content is empty");

      console.error("[admin/import-csv] Import error:", err);
      return NextResponse.json(
        { error: message },
        { status: isBadInput ? 400 : 500 }
      );
    }
  } catch (error) {
    console.error("[admin/import-csv] POST error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV import" },
      { status: 500 }
    );
  }
}
