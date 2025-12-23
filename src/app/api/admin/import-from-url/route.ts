// src/app/api/admin/import-from-url/route.ts
// Import CSV data from a remote URL and reuse the core CSV import logic.

import { NextRequest, NextResponse } from "next/server";
import { googleSheetAdapter } from "@/lib/affiliates/googleSheet";
import { importNormalizedListings } from "@/lib/importService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/import-from-url
 * Body: { url: string }
 *
 * Downloads a CSV from the given URL and runs the shared CSV importer.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    const raw = body as any;
    const url = typeof raw?.url === "string" ? raw.url.trim() : "";
    const validateUrls = typeof raw?.validateUrls === "boolean" ? raw.validateUrls : false;

    if (!url) {
      return NextResponse.json(
        { error: "url is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    console.log("[admin/import-from-url] Starting import from URL:", url);

    let response: Response;
    try {
      response = await fetch(url);
    } catch (err) {
      console.error("[admin/import-from-url] Fetch error:", err);
      return NextResponse.json(
        { error: "Failed to fetch CSV from the provided URL" },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error(
        "[admin/import-from-url] Non-200 response:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        {
          error: `Failed to download CSV: HTTP ${response.status} ${response.statusText}`,
        },
        { status: 502 }
      );
    }

    const csvText = await response.text();

    if (!csvText.trim()) {
      return NextResponse.json(
        { error: "CSV downloaded from URL is empty" },
        { status: 400 }
      );
    }

    try {
      const normalized = googleSheetAdapter.normalize(csvText);
      const summary = await importNormalizedListings(normalized, {
        source: "sheet",
        defaultCountryCode: "RO",
        startRowNumber: 2,
        validateUrls,
      });
      console.log("[admin/import-from-url] Import completed:", {
        url,
        summary,
      });
      return NextResponse.json({ summary }, { status: 200 });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process CSV";

      const isBadInput =
        message.startsWith("CSV ") ||
        message.startsWith("Missing required columns") ||
        message.includes("header row") ||
        message.includes("CSV content is empty");

      console.error("[admin/import-from-url] Import error:", err);
      return NextResponse.json(
        { error: message },
        { status: isBadInput ? 400 : 500 }
      );
    }
  } catch (error) {
    console.error("[admin/import-from-url] POST error:", error);
    return NextResponse.json(
      { error: "Failed to import from URL" },
      { status: 500 }
    );
  }
}
