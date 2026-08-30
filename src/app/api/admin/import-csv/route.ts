import 'server-only';

import { NextRequest, NextResponse } from "next/server";
import { validateAdminToken } from "@/lib/adminAuth";
import { isValidProvider } from "@/config/affiliateIngestion";
import { processCsvImport } from "@/lib/ingestion/csvProcessor";

export const dynamic = "force-dynamic";

const MAX_IMPORT_ROWS = 300;

function buildImportErrorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function buildCsvValidationErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/^Missing required columns:\s*(.+)$/i);

  if (!match) return null;

  const missingColumns = match[1]
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);

  return NextResponse.json(
    {
      ok: false,
      error: "Your CSV is missing required columns. Download the template CSV and try again.",
      missingColumns,
    },
    { status: 400 },
  );
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
    const providerParam = (formData.get("provider") as string | null) ?? "generic";
    const provider = isValidProvider(providerParam) ? providerParam : "generic";
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

    const result = await processCsvImport({
      provider,
      csv: content,
    });

    return buildImportResponse(
      result.summary,
      result.totalRows ?? 0,
      provider,
      result.skippedRows ?? 0,
      result.capped ?? false,
      result.message ?? providerMessage,
    );
  } catch (error) {
    console.error("[admin/import-csv] POST error:", error);
    const validationError = buildCsvValidationErrorResponse(error);
    if (validationError) return validationError;

    return NextResponse.json(
      { ok: false, error: "Failed to process CSV import" },
      { status: 500 },
    );
  }
}
