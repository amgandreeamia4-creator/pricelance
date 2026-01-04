// src/app/api/admin/import-csv/route.ts
// CSV bulk import for Products + Listings (file upload)
//
// This route now has two paths:
// - provider = "2performant" → uses twoPerformantAdapter + importNormalizedListings
// - provider = "profitshare" → uses legacy ProfitshareRow pipeline (parseProfitshareCsv + processBatch)

import { NextRequest, NextResponse } from "next/server";
import { validateAdminToken } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  parseProfitshareCsv,
  parseAvailability,
  type ProfitshareRow,
} from "@/lib/affiliates/profitshare";
import { isValidProvider } from "@/config/affiliateIngestion";
import { importNormalizedListings } from "@/lib/importService";
import { parse } from "csv-parse/sync";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 100;
const MAX_IMPORT_ROWS = 300;

// Use loose typing to avoid TS complaining if schema drifts
const db: any = prisma;

// Helper functions for 2Performant CSV processing
function detectDelimiter(raw: string): string {
  const firstLine = raw.split(/\r?\n/)[0] ?? "";
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;

  for (const d of candidates) {
    const regex = new RegExp(`\\${d}`, "g");
    const count = (firstLine.match(regex) || []).length;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }

  return best;
}

function normalizeHeaders<T extends Record<string, any>>(row: T): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.trim().toLowerCase();
    out[normalizedKey] = value;
  }
  return out;
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;

  // Handles "392,4", "392.40", "392,40 lei", etc.
  const normalized = s.replace(",", ".").replace(/[^0-9.]/g, "");
  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
}

type TwoPerformantImportRow = {
  title: string;
  affCode: string;
  price: number;
  campaignName?: string;
  imageUrls?: string;
  description?: string;
  storeName?: string;
  currency?: string;
  categoryRaw?: string;
  availability?: string;
};

/**
 * Find or create a Product based on name (and optional category).
 * Legacy path for Profitshare rows.
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
 * Legacy path for Profitshare rows.
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
    priceCents: Math.min(Math.round(row.price * 100), 2147483647),
    currency: row.currency,
    inStock,
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
 * Process a batch of ProfitshareRow rows – legacy path.
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
  skippedMissingExternalId: number;
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
      const { productId, isNew: isNewProduct } = await findOrCreateProduct(row);
      if (isNewProduct) createdProducts++;
      else updatedProducts++;

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

    // -----------------------------------------------------------------------
    // 2Performant path — enhanced CSV parsing with delimiter auto-detection
    // -----------------------------------------------------------------------
    if (provider === "2performant") {
      console.log("[import-csv] Using enhanced 2Performant CSV parsing");

      const raw = await file.text();
      const delimiter = detectDelimiter(raw);
      
      console.log(`[import-csv] Detected delimiter: "${delimiter}"`);

      const records = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        delimiter, // auto-detected , ; \t |
        relax_column_count: true,
        trim: true,
      });

      const normalizedRows = (records as Record<string, any>[]).map(normalizeHeaders);
      const totalRows = normalizedRows.length;
      const isCapped = totalRows > MAX_IMPORT_ROWS;

      console.log(`[import-csv] Parsed ${totalRows} rows with delimiter "${delimiter}"`);

      // Validate and extract 2Performant rows
      let invalidRows = 0;
      const validRows: TwoPerformantImportRow[] = [];

      for (const row of normalizedRows) {
        const title = (row["title"] ?? row["product name"] ?? row["name"] ?? "").trim();
        const affCode =
          (row["aff_code"] ?? row["aff link"] ?? row["affiliate_link"] ?? row["product affiliate"] ?? row["url"] ?? "").trim();
        const price = toNumber(row["price"] ?? row["sale_price"] ?? row["old_price"] ?? row["price with discount"] ?? row["price with vat"] ?? row["price without vat"]);

        const campaignName = (row["campaign_name"] ?? row["program_name"] ?? row["advertiser name"] ?? "").trim();
        const imageUrls = (row["image_urls"] ?? row["image_url"] ?? row["product picture"] ?? "").trim();
        const description = (row["description"] ?? row["descriere"] ?? row["product description"] ?? "").trim();
        const storeName = (row["store_name"] ?? row["advertiser name"] ?? campaignName ?? "").trim();
        const currency = (row["currency"] ?? "RON").trim().toUpperCase();
        const categoryRaw = (row["category"] ?? "").trim();
        const availability = (row["availability"] ?? "").trim();

        // Required fields validation
        const hasRequiredFields = Boolean(title && affCode && price != null && price > 0);

        if (!hasRequiredFields) {
          invalidRows++;
          console.log(`[import-csv] Invalid row - title: "${title}", affCode: "${affCode}", price: ${price}`);
          continue;
        }

        validRows.push({
          title,
          affCode,
          price: price as number,
          campaignName: campaignName || undefined,
          imageUrls: imageUrls || undefined,
          description: description || undefined,
          storeName: storeName || undefined,
          currency: currency || "RON",
          categoryRaw: categoryRaw || undefined,
          availability: availability || undefined,
        });
      }

      const limitedRows = validRows.slice(0, MAX_IMPORT_ROWS);

      if (limitedRows.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            message:
              `Parsed ${normalizedRows.length} rows but 0 passed validation for 2Performant. ` +
              `Required fields: non-empty title, non-empty aff_code/affiliate link, numeric price > 0. ` +
              `Check that your CSV headers look like: title, aff_code, price, campaign_name, image_urls, description. ` +
              `Detected delimiter: "${delimiter}".`,
            totalRows: normalizedRows.length,
            processedRows: 0,
            skippedRows: normalizedRows.length,
            skipped: normalizedRows.length,
            createdProducts: 0,
            updatedProducts: 0,
            createdListings: 0,
            updatedListings: 0,
            skippedMissingFields: invalidRows,
            skippedMissingExternalId: 0,
            failedRows: invalidRows,
            failed: invalidRows,
            errors: [],
            truncated: isCapped,
            capped: isCapped,
            maxRowsPerImport: MAX_IMPORT_ROWS,
            provider,
            sampleRow: normalizedRows[0] ?? null,
          },
          { status: 400 },
        );
      }

      // Convert valid rows to NormalizedListing format
      const normalizedListings = limitedRows.map((row) => ({
        productTitle: row.title,
        brand: row.title.split(" ")[0] || "Unknown", // Simple brand extraction
        category: row.categoryRaw || "General",
        gtin: undefined,
        storeId: row.storeName?.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_") || "unknown",
        storeName: row.storeName || "Unknown",
        url: row.affCode,
        price: row.price,
        currency: row.currency || "RON",
        deliveryDays: undefined,
        fastDelivery: undefined,
        inStock: true, // Default to true, could be enhanced with availability parsing
        countryCode: "RO",
        source: "affiliate" as const,
      }));

      const summary = await importNormalizedListings(normalizedListings, {
        source: "affiliate",
        defaultCountryCode: "RO",
        affiliateProvider: "2performant",
        affiliateProgram: "2performant_ro",
        network: "TWOPERFORMANT",
        startRowNumber: 2,
      });

      const processedRows =
        summary.listingRows + summary.productOnlyRows;
      const skippedRows = totalRows - processedRows;
      const failedRows = summary.errors.length;
      const ok = processedRows > 0;

      const errors = summary.errors.map((e) => ({
        rowNumber: e.rowNumber,
        message: e.message,
        code: null as string | null,
      }));

      const message = isCapped
        ? `Processed first ${limitedRows.length} rows out of ${totalRows}. Split your CSV and re-upload remaining rows.` 
        : null;

      return NextResponse.json(
        {
          ok,
          totalRows,
          processedRows,
          skippedRows,
          skipped: skippedRows,
          createdProducts: summary.productsCreated,
          updatedProducts: summary.productsMatched,
          createdListings: summary.listingsCreated,
          updatedListings: summary.listingsUpdated,
          skippedMissingFields: invalidRows,
          skippedMissingExternalId: 0,
          failedRows,
          failed: failedRows,
          errors,
          truncated: isCapped,
          message,
          capped: isCapped,
          maxRowsPerImport: MAX_IMPORT_ROWS,
          provider,
        },
        { status: 200 },
      );
    }

    // -----------------------------------------------------------------------
    // Profitshare path — legacy CSV pipeline (parseProfitshareCsv + processBatch)
    // -----------------------------------------------------------------------

    let parseResult;
    try {
      parseResult = parseProfitshareCsv(content);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[admin/import-csv] CSV parse error (profitshare):", err);
      return NextResponse.json(
        { ok: false, error: `Failed to parse profitshare CSV: ${message}` },
        { status: 500 },
      );
    }

    const { rows, skippedMissingFields, headerError } = parseResult;

    if (headerError) {
      return NextResponse.json(
        { ok: false, error: headerError },
        { status: 400 },
      );
    }

    const adaptedRows = rows as ProfitshareRow[];
    const affiliateMetadata: { provider?: string; program?: string }[] =
      adaptedRows.map(() => ({
        provider: "profitshare",
        program: undefined,
      }));

    const totalRows = adaptedRows.length;
    const limitedRows = adaptedRows.slice(0, MAX_IMPORT_ROWS);
    const limitedMetadata = affiliateMetadata.slice(0, MAX_IMPORT_ROWS);
    const isCapped = totalRows > MAX_IMPORT_ROWS;

    console.log(
      `[import-csv] (profitshare) Starting import: totalRows=${totalRows}, processedRows=${limitedRows.length}, capped=${isCapped}`,
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
      `[import-csv] (profitshare) Import complete: processedRows=${limitedRows.length}, created=${createdProducts}/${createdListings}, updated=${updatedProducts}/${updatedListings}, failed=${failedRows}, duration=${durationMs}ms`,
    );

    if (errors.length > 50) {
      errors = errors.slice(0, 50);
    }

    const message = isCapped
      ? `Processed first ${limitedRows.length} rows out of ${totalRows}. Split your CSV and re-upload remaining rows.` 
      : null;

    const skippedRows = skippedMissingFields;
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
        provider,
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