// src/app/api/admin/import-from-url/route.ts
// Import CSV data from a remote URL and reuse the core CSV import logic.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { googleSheetAdapter } from "@/lib/ingestion/adapters";
import { ingestionQueue, ingestionQueueEvents } from "@/lib/ingestionQueue";
import { validateAdminToken } from "@/lib/adminAuth";
import { SafeRemoteUrlError, safeFetchRemoteText } from "@/lib/security/safeRemoteUrl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    const raw = body as any;
    const url = typeof raw?.url === "string" ? raw.url.trim() : "";
    const validateUrls = typeof raw?.validateUrls === "boolean" ? raw.validateUrls : false;
    const merchantFeedId = typeof raw?.merchantFeedId === "string" ? raw.merchantFeedId.trim() : "";

    if (!url) {
      return NextResponse.json(
        { error: "url is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    const merchantId: string | undefined = undefined;

    console.log("[admin/import-from-url] Starting import from URL:", url);

    let csvText: string;
    try {
      csvText = await safeFetchRemoteText(url);
    } catch (err) {
      const message = err instanceof SafeRemoteUrlError
        ? err.message
        : "Remote CSV is not available or is invalid.";

      console.error("[admin/import-from-url] Fetch error:", message);
      return NextResponse.json(
        { error: message },
        { status: err instanceof SafeRemoteUrlError ? 400 : 502 },
      );
    }

    if (!csvText.trim()) {
      return NextResponse.json(
        { error: "CSV downloaded from URL is empty" },
        { status: 400 },
      );
    }

    try {
      googleSheetAdapter.normalize(csvText);
      const job = await ingestionQueue.add("url_import", {
        csv: csvText,
        validateUrls,
        merchantId: undefined,
        merchantFeedId: undefined,
      });
      const jobResult = await job.waitUntilFinished(ingestionQueueEvents);
      console.log("[admin/import-from-url] Import completed:", {
        url,
        result: jobResult,
      });
      return NextResponse.json({ summary: (jobResult as any).summary }, { status: 200 });
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
        { status: isBadInput ? 400 : 500 },
      );
    }
  } catch (error) {
    console.error("[admin/import-from-url] POST error:", error);
    return NextResponse.json(
      { error: "Failed to import from URL" },
      { status: 500 },
    );
  }
}
