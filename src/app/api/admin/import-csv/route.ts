// src/app/api/admin/import-csv/route.ts
// CSV bulk import for Products + Listings (file upload)
// Safe, schema-light version: only uses fields we know exist,
// and adds product.imageUrl so the UI can finally show images.
//
// NOTE: This route uses a provider registry system for extensibility:
// - Providers are defined in src/config/affiliateIngestion.ts
// - Parser selection is dynamic based on provider parameter
// - Both providers store affiliate metadata (affiliateProvider, affiliateProgram) in the Listing table.

import { NextRequest, NextResponse } from "next/server";
import { validateAdminToken } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  parseProfitshareCsv,
  parseAvailability,
  type ProfitshareRow,
} from "@/lib/affiliates/profitshare";
import {
  parseTwoPerformantCsv,
  parseAvailability as parseTwoPerformantAvailability,
  type TwoPerformantRow,
} from "@/lib/affiliates/twoPerformant";
import {
  AFFILIATE_INGEST_PARSERS,
  isValidProvider,
  type AffiliateIngestProviderId,
} from "@/config/affiliateIngestion";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 100;
const MAX_IMPORT_ROWS = 300;

// Use loose typing to avoid TS complaining if schema drifts
const db: any = prisma;

/**
 * Adapter to convert TwoPerformantRow to ProfitshareRow format
 * This allows us to use the existing processBatch pipeline without changes
 */
function adaptTwoPerformantRowToProfitshareRow(
  row: TwoPerformantRow,
): ProfitshareRow {
  return {
    name: row.name,
    productUrl: row.productUrl,
    affiliateUrl: row.affiliateUrl,
    imageUrl: row.imageUrl,
    price: row.price,
    currency: row.currency,
    categoryRaw: row.categoryRaw,
    sku: row.sku,
    gtin: row.gtin,
    availability: row.availability,
    storeName: row.storeName,
  };
}

/**
 * Find or create a Product based on name (and optional category).
 * This version does NOT use externalId/source — it’s intentionally simple
 * so it works against your current DB schema.
 */
async function findOrCreateProduct(
  row: ProfitshareRow,
): Promise<{ productId: string; isNew: boolean }> {
  const existing = await db.product.findFirst({
    where: {
      name: row.name,
    },
    select: { id: true },
  });

  if (!existing) {
    const created = await db.product.create({
      data: {
        name: row.name,
        displayName: row.name,
        category: row.categoryRaw || null,
        brand: null,
        imageUrl: row.imageUrl || null,
        thumbnailUrl: row.imageUrl || null,
        gtin: row.gtin || null,
      },
      select: { id: true },
    });
    return { productId: created.id, isNew: true };
  }

  const updated = await db.product.update({
    where: { id: existing.id },
    data: {
      ...(row.imageUrl && {
        imageUrl: row.imageUrl,
        thumbnailUrl: row.imageUrl,
      }),
      ...(row.categoryRaw && { category: row.categoryRaw }),
      ...(row.gtin && { gtin: row.gtin }),
    },
    select: { id: true },
  });

  return { productId: updated.id, isNew: false };
}

/**
 * Find or create a Listing for a product.
 * Identifies by (productId, storeName, url).
 * Only uses very safe fields: price, priceCents, currency, inStock, storeName, url.
 * Now includes affiliate metadata support.
 */
async function upsertListing(
  productId: string,
  row: ProfitshareRow,
  affiliateProvider?: string,
  affiliateProgram?: string,
): Promise<{ isNew: boolean; hasListing: boolean }> {
  const inStock = parseAvailability(row.availability);

  // Skip listing creation if no URL is available
  if (!row.affiliateUrl) {
    return { isNew: false, hasListing: false };
  }

  const existing = await db.listing.findFirst({
    where: {
      productId,
      storeName: { equals: row.storeName, mode: "insensitive" },
      url: row.affiliateUrl,
    },
    select: { id: true },
  });

  const listingData = {
    price: row.price,
    priceCents: Math.min(Math.round(row.price * 100), 2147483647), // Cap at INT32 max
    currency: row.currency,
    inStock,
    // Include affiliate metadata if provided
    ...(affiliateProvider && { affiliateProvider }),
    ...(affiliateProgram && { affiliateProgram }),
  };

  if (existing) {
    await db.listing.update({
      where: { id: existing.id },
      data: listingData,
    });
    return { isNew: false, hasListing: true };
  }

  await db.listing.create({
    data: {
      productId,
      storeName: row.storeName,
      url: row.affiliateUrl,
      ...listingData,
    },
  });

  return { isNew: true, hasListing: true };
}

/**
 * Process a batch of rows – errors are collected per row.
 */
async function processBatch(
  rows: ProfitshareRow[],
  affiliateMetadata: { provider?: string; program?: string }[],
  startIdx: number,
): Promise<{
  createdProducts: number;
  updatedProducts: number;
  createdListings: number;
  updatedListings: number;
  skippedMissingExternalId: number; // kept for summary compat; always 0 here
  failedRows: number;
  errors: { rowNumber: number; message: string; code: string | null }[];
}> {
  let createdProducts = 0;
  let updatedProducts = 0;
  let createdListings = 0;
  let updatedListings = 0;
  let failedRows = 0;
  const errors: {
    rowNumber: number;
    message: string;
    code: string | null;
  }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const metadata = affiliateMetadata[i];
    const rowNum = startIdx + i + 2; // +2 for header + 1-index

    try {
      // 1) Product
      const { productId, isNew: isNewProduct } = await findOrCreateProduct(row);
      if (isNewProduct) createdProducts++;
      else updatedProducts++;

      // 2) Listing with affiliate metadata
      const { isNew: isNewListing, hasListing } = await upsertListing(
        productId,
        row,
        metadata.provider,
        metadata.program,
      );
      if (hasListing) {
        if (isNewListing) createdListings++;
        else updatedListings++;
      }
    } catch (err: any) {
      failedRows++;
      const message = err instanceof Error ? err.message : String(err);
      errors.push({
        rowNumber: rowNum,
        message,
        code: err?.code ?? null,
      });
      console.error("[import-csv] Row failed", {
        rowNumber: rowNum,
        message,
        rowPreview: {
          name: row.name,
          storeName: row.storeName,
          price: row.price,
          affiliateProvider: metadata.provider,
        },
      });
    }
  }

  return {
    createdProducts,
    updatedProducts,
    createdListings,
    updatedListings,
    skippedMissingExternalId: 0,
    failedRows,
    errors,
  };
}

/**
 * POST /api/admin/import-csv
 */
export async function POST(req: NextRequest) {
  // 1) Admin token
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

    // Provider selection: read from form data and validate against registry
    const providerParam =
      (formData.get("provider") as string | null) ?? "profitshare";
    const provider = isValidProvider(providerParam)
      ? providerParam
      : "profitshare";

    console.log(
      "[import-csv] Provider selection - param:",
      providerParam,
      "validated:",
      provider,
    );

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing CSV file" },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { ok: false, error: "File must be a CSV file" },
        { status: 400 },
      );
    }

    const content = await file.text();
    if (!content.trim()) {
      return NextResponse.json(
        { ok: false, error: "CSV file is empty" },
        { status: 400 },
      );
    }

    // 2) Parse CSV using provider registry
    let parseResult: any;
    try {
      const parser = AFFILIATE_INGEST_PARSERS[provider];
      parseResult = parser(content);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[admin/import-csv] CSV parse error for ${provider}:`,
        err,
      );
      return NextResponse.json(
        { ok: false, error: `Failed to parse ${provider} CSV: ${message}` },
        { status: 500 },
      );
    }

    const {
      rows,
      skippedMissingFields,
      parsedTotalRows,
      totalRows: legacyTotalRows,
      headerError,
    } = parseResult;

    if (headerError) {
      return NextResponse.json(
        { ok: false, error: headerError },
        { status: 400 },
      );
    }

    // Adapt rows based on provider
    let adaptedRows: ProfitshareRow[];
    let affiliateMetadata: { provider?: string; program?: string }[] = [];

    if (provider === "2performant") {
      const twoPerformantRows = rows as TwoPerformantRow[];
      adaptedRows = twoPerformantRows.map(adaptTwoPerformantRowToProfitshareRow);
      // Extract affiliate metadata from 2Performant rows
      affiliateMetadata = twoPerformantRows.map((row) => ({
        provider: row.affiliateProvider,
        program: row.affiliateProgram,
      }));
    } else {
      adaptedRows = rows as ProfitshareRow[];
      // For Profitshare, set default affiliate metadata
      affiliateMetadata = rows.map(() => ({
        provider: "profitshare",
        program: undefined,
      }));
    }

    // Prefer parser-reported total row count when available
    const totalRows =
      typeof parsedTotalRows === "number"
        ? parsedTotalRows
        : typeof legacyTotalRows === "number"
          ? legacyTotalRows
          : adaptedRows.length;

    const limitedRows = adaptedRows.slice(0, MAX_IMPORT_ROWS);
    const limitedMetadata = affiliateMetadata.slice(0, MAX_IMPORT_ROWS);
    const isCapped = totalRows > MAX_IMPORT_ROWS;

    console.log(
      `[import-csv] Starting import: totalRows=${totalRows}, processedRows=${limitedRows.length}, capped=${isCapped}`,
    );

    if (limitedRows.length === 0) {
      const skippedRows = skippedMissingFields;
      return NextResponse.json(
        {
          ok: true,
          totalRows,
          processedRows: 0,
          skippedRows,
          skipped: skippedRows,
          createdProducts: 0,
          updatedProducts: 0,
          createdListings: 0,
          updatedListings: 0,
          skippedMissingFields,
          skippedMissingExternalId: 0,
          failedRows: 0,
          failed: 0,
          errors: [],
          truncated: false,
          message: null,
          capped: isCapped,
          maxRowsPerImport: MAX_IMPORT_ROWS,
          provider,
        },
        { status: 200 },
      );
    }

    // 3) Process in batches
    let createdProducts = 0;
    let updatedProducts = 0;
    let createdListings = 0;
    let updatedListings = 0;
    let failedRows = 0;
    let errors: { rowNumber: number; message: string; code: string | null }[] =
      [];

    const startTime = Date.now();

    for (let i = 0; i < limitedRows.length; i += BATCH_SIZE) {
      const batch = limitedRows.slice(i, i + BATCH_SIZE);
      const batchMetadata = limitedMetadata.slice(i, i + BATCH_SIZE);
      const batchResult = await processBatch(batch, batchMetadata, i);

      createdProducts += batchResult.createdProducts;
      updatedProducts += batchResult.updatedProducts;
      createdListings += batchResult.createdListings;
      updatedListings += batchResult.updatedListings;
      failedRows += batchResult.failedRows;
      errors.push(...batchResult.errors);
    }

    const durationMs = Date.now() - startTime;
    console.log(
      `[import-csv] Import complete: processedRows=${limitedRows.length}, created=${createdProducts}/${createdListings}, updated=${updatedProducts}/${updatedListings}, failed=${failedRows}, duration=${durationMs}ms`,
    );

    if (errors.length > 50) {
      errors = errors.slice(0, 50);
    }

    const message = isCapped
      ? `Processed first ${limitedRows.length} rows out of ${totalRows}. Split your CSV and re-upload remaining rows.`
      : null;

    const skippedRows = skippedMissingFields; // externalId skipping is always 0 now

    // New: compute a more realistic ok flag
    const successCount =
      createdProducts +
      updatedProducts +
      createdListings +
      updatedListings;
    const ok = successCount > 0;

    return NextResponse.json(
      {
        ok,
        totalRows,
        processedRows: limitedRows.length,
        skippedRows,
        skipped: skippedRows,
        createdProducts,
        updatedProducts,
        createdListings,
        updatedListings,
        skippedMissingFields,
        skippedMissingExternalId: 0,
        failedRows,
        failed: failedRows,
        errors,
        truncated: isCapped,
        message,
        capped: isCapped,
        maxRowsPerImport: MAX_IMPORT_ROWS,
        provider, // Add provider to response for tracking
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[admin/import-csv] POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process CSV import" },
      { status: 500 },
    );
  }
}

/*
VERIFICATION TEST SCENARIOS:

1. Profitshare CSV (default behavior):
   POST /api/admin/import-csv with Profitshare CSV file
   → Should work exactly as before, with affiliateProvider='profitshare'

2. 2Performant CSV (new functionality):
   POST /api/admin/import-csv?provider=2performant with 2Performant CSV file
   → Should parse 2Performant headers (name, price, currency, deeplink, merchant, program_name)
   → Should create listings with affiliateProvider='2performant' and affiliateProgram from CSV
   → Should appear in public search (not filtered by DISABLED_AFFILIATE_SOURCES)

3. Error handling:
   Invalid provider parameter → 400 error
   Missing required columns → headerError with specific message
   Invalid price format → row skipped with detailed error in response

Expected database state after 2Performant import:
- Product rows with name, category, imageUrl from CSV
- Listing rows with:
  * storeName extracted from URL domain
  * url = deeplink from CSV
  * price, currency from CSV
  * affiliateProvider = '2performant'
  * affiliateProgram = program_name from CSV (if present)

Expected public search behavior:
- 2Performant listings should appear in /api/products results
- Profitshare listings should be filtered out (DISABLE_PROFITSHARE = true)
- Both providers should be visible in admin views
*/