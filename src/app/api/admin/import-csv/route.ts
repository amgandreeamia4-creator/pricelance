import 'server-only';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAdminToken } from "@/lib/adminAuth";
import { isValidProvider } from "@/config/affiliateIngestion";
import { ingestionQueue, ingestionQueueEvents } from "@/lib/ingestionQueue";
import { profitshareAdapter, twoPerformantAdapter } from "@/lib/ingestion/adapters";

export const dynamic = "force-dynamic";

const MAX_IMPORT_ROWS = 300;

function buildImportErrorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function resolveMerchantContext(
  merchantFeedId: string | null,
) {
  if (!merchantFeedId) {
    return { merchantId: undefined, merchantFeedId: undefined };
  }

  const feed = await (prisma as any).merchantFeed.findUnique({
    where: { id: merchantFeedId },
    select: { merchantId: true },
  });

  if (!feed) {
    console.warn(`[import-csv] MerchantFeed not found: ${merchantFeedId}`);
    return { merchantId: undefined, merchantFeedId: undefined };
  }

  return {
    merchantId: feed.merchantId,
    merchantFeedId,
  };
}

function buildImportResponse(
  summary: any,
  totalRows: number,
  provider: string,
  skippedRows: number,
  capped: boolean,
  message: string | null,
) {
  const processedRows = summary.listingRows + summary.productOnlyRows;
  const failedRows = summary.errors.length;

  return NextResponse.json(
    {
      ok: failedRows === 0,
      totalRows,
      processedRows,
      skippedRows,
      skipped: skippedRows,
      createdProducts: summary.productsCreated,
      updatedProducts: summary.productsMatched,
      createdListings: summary.listingsCreated,
      updatedListings: summary.listingsUpdated,
      skippedMissingFields: summary.skippedMissingFields ?? undefined,
      skippedMissingExternalId: 0,
      failedRows,
      errors: summary.errors.slice(0, 10),
      debugErrors: summary.debugErrors?.slice(0, 10) ?? [],
      truncated: capped,
      message,
      capped,
      maxRowsPerImport: MAX_IMPORT_ROWS,
      provider,
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json(
      { ok: false, error: authError.error },
      { status: authError.status },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const providerParam = (formData.get("provider") as string | null) ?? "profitshare";
    const provider = isValidProvider(providerParam) ? providerParam : "profitshare";
    const merchantFeedId = (formData.get("merchantFeedId") as string | null) || null;
    const merchantContext = await resolveMerchantContext(merchantFeedId);
    const providerMessage = null;

    if (!file || !(file instanceof File)) {
      return buildImportErrorResponse("Missing CSV file", 400);
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return buildImportErrorResponse("File must be a CSV file", 400);
    }

    const content = await file.text();
    if (!content.trim()) {
      return buildImportErrorResponse("CSV file is empty", 400);
    }

    let normalizedRows = [] as any[];
    let totalRows = 0;
    let skippedRows = 0;
    let skippedMissingFields = 0;
    let headerError: string | undefined;

    if (provider === "2performant") {
      const result = twoPerformantAdapter.normalizeWithMeta(content);
      headerError = result.headerError;
      if (headerError) {
        return buildImportErrorResponse(headerError, 400);
      }

      normalizedRows = result.normalized;
      totalRows = result.totalRows;
      skippedRows = result.skippedRows;
      skippedMissingFields = result.skippedMissingFields ?? 0;

      if (normalizedRows.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            totalRows,
            processedRows: 0,
            skippedRows,
            skipped: skippedMissingFields,
            createdProducts: 0,
            updatedProducts: 0,
            createdListings: 0,
            updatedListings: 0,
            skippedMissingFields,
            skippedMissingExternalId: 0,
            failedRows: skippedRows,
            errors: [],
            debugErrors: [],
            truncated: false,
            message: "No valid 2Performant rows were found in the CSV.",
            capped: false,
            maxRowsPerImport: MAX_IMPORT_ROWS,
            provider,
          },
          { status: 400 },
        );
      }
    } else {
      const result = profitshareAdapter.normalizeWithMeta(content);
      headerError = result.headerError;
      if (headerError) {
        return buildImportErrorResponse(headerError, 400);
      }

      normalizedRows = result.normalized;
      totalRows = result.totalRows;
      skippedRows = result.skippedRows;
      skippedMissingFields = result.skippedMissingFields ?? 0;

      if (normalizedRows.length === 0) {
        return NextResponse.json(
          {
            ok: true,
            totalRows,
            processedRows: 0,
            skippedRows,
            skipped: skippedMissingFields,
            createdProducts: 0,
            updatedProducts: 0,
            createdListings: 0,
            updatedListings: 0,
            skippedMissingFields,
            skippedMissingExternalId: 0,
            failedRows: 0,
            errors: [],
            debugErrors: [],
            truncated: false,
            message: null,
            capped: false,
            maxRowsPerImport: MAX_IMPORT_ROWS,
            provider,
          },
          { status: 200 },
        );
      }
    }

    const cappedRows = normalizedRows.slice(0, MAX_IMPORT_ROWS);
    const capped = normalizedRows.length > MAX_IMPORT_ROWS;

    const job = await ingestionQueue.add("csv_import", {
      provider,
      csv: content,
      merchantFeedId,
      merchantId: merchantContext.merchantId,
    });

    const jobResult = await job.waitUntilFinished(ingestionQueueEvents);

    return buildImportResponse(
      (jobResult as any).summary,
      (jobResult as any).totalRows ?? totalRows,
      provider,
      (jobResult as any).skippedRows ?? skippedRows,
      (jobResult as any).capped ?? capped,
      (jobResult as any).message ?? providerMessage,
    );
  } catch (error) {
    console.error("[admin/import-csv] POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process CSV import" },
      { status: 500 },
    );
  }
}
