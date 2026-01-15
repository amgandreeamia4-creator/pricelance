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

  // Use ; if present, otherwise , (as per requirements)
  if (firstLine.includes(';')) {
    return ";";
  }

  return ",";
}

// Simplified header normalization for common Romanian headers
function normalizeHeaders<T extends Record<string, any>>(row: T): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    // Remove BOM, trim whitespace, convert to lowercase
    const normalizedKey = key.replace(/^\uFEFF/, '').trim().toLowerCase();
    
    // Map common Romanian headers to standard field names
    const mappedKey = mapRomanianHeaderToStandardField(normalizedKey);
    out[mappedKey] = value;
  }
  return out;
}

// Map common Romanian headers to standard field names
function mapRomanianHeaderToStandardField(header: string): string {
  // Product name variations
  if (header.includes('nume produs') || header.includes('product name') || header.includes('product_name') || header.includes('name')) {
    return 'product_name';
  }
  
  // URL/affiliate variations
  if (header.includes('affiliate link') || header.includes('affiliate_link') || header.includes('product affiliate') || header.includes('link afiliat') || header.includes('url') || header.includes('link') || header.includes('product url')) {
    return 'url';
  }
  
  // Price variations
  if (header.includes('pret') || header.includes('price') || header.includes('price_final') || header.includes('pret reducere') || header.includes('price_value')) {
    return 'price';
  }
  
  // Image variations
  if (header.includes('image') || header.includes('image_url') || header.includes('img') || header.includes('product picture')) {
    return 'image_url';
  }
  
  // Store/advertiser variations
  if (header.includes('store_name') || header.includes('advertiser name') || header.includes('magazin') || header.includes('campaign_name')) {
    return 'store_name';
  }
  
  // Category variations
  if (header.includes('category') || header.includes('categorie')) {
    return 'category';
  }
  
  // Currency variations
  if (header.includes('currency') || header.includes('moneda')) {
    return 'currency';
  }
  
  // External ID variations
  if (header.includes('id produs') || header.includes('external_id') || header.includes('id')) {
    return 'external_id';
  }
  
  // Default fallback
  return header;
}

// Helper function to normalize a single header
function normalizeHeader(h: string): string {
  return h.replace(/^\uFEFF/, '').trim().toLowerCase();
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

// Simplified Romanian price parsing
function extractPrice(row: Record<string, any>): number | null {
  // Accept price from common Romanian fields
  const priceRaw = row['price'] || row['pret'] || row['price_value'] || row['price_final'] || row['pret reducere'];

  if (priceRaw == null) return null;

  const s = String(priceRaw).trim();
  if (!s) return null;

  // Romanian format: replace "." with "", "," with ".", then parseFloat
  let cleaned = s.replace(/[^\d.,\-]/g, '');
  if (!cleaned) return null;

  // Handle Romanian format: 1.234,56 → 1234.56
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  
  if (lastComma > lastDot && cleaned.length - lastComma <= 4) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && cleaned.length - lastDot <= 4) {
    // International format: 1,234.56
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // Fallback: just strip commas
    cleaned = cleaned.replace(/,/g, '');
  }

  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? num : null;
}

type TwoPerformantImportRow = {
  title: string;
  affCode: string;
  price: number;
  storeName?: string;
  imageUrls?: string;
  categoryRaw?: string;
  currency?: string;
  externalId?: string;
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

  const existing = await db.listings.findFirst({
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
    await db.listings.update({
      where: { id: existing.id },
      data: listingData,
    });
    return { isNew: false, hasListing: true };
  }

  await db.listings.create({
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

      const delimiter = detectDelimiter(content);
      console.log(`[import-csv] Detected delimiter: "${delimiter}"`);
      console.log(`[import-csv] Raw CSV content (first 200 chars):`, content.substring(0, 200));

      const records = parse(content, {
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

      // Validate and extract 2Performant rows with detailed logging
      let invalidRows = 0;
      const validRows: TwoPerformantImportRow[] = [];
      const failReasons: string[] = [];
      for (let i = 0; i < normalizedRows.length; i++) {
        const row = normalizedRows[i];
        const rowNum = i + 2; // +2 for header + 1-index

        // Basic field extraction with Romanian header support
        const title = (row['product_name'] ?? row['title'] ?? row['name'] ?? row['nume produs'] ?? "").trim();
        const affCode = (row['url'] ?? row['affiliate_link'] ?? row['product affiliate'] ?? "").trim();
        const price = extractPrice(row);
        
        // Optional fields with defaults
        const storeName = (row['store_name'] ?? row['advertiser name'] ?? row['magazin'] ?? "Unknown").trim();
        const imageUrls = (row['image_url'] ?? row['image'] ?? row['img'] ?? undefined)?.trim();
        const categoryRaw = (row['category'] ?? row['categorie'] ?? "").trim();
        const currency = (row['currency'] ?? row['moneda'] ?? "RON").trim().toUpperCase();
        const externalId = (row['external_id'] ?? row['id produs'] ?? "").trim();

        // Forgiving validation - only essentials required
        let failReason = "";
        
        if (!title) {
          failReason = "Missing product_name";
        } else if (price == null || Number.isNaN(price) || price <= 0) {
          failReason = "Invalid price (must be > 0)";
        } else if (!affCode) {
          failReason = "Missing URL";
        }

        if (failReason) {
          invalidRows++;
          const detailedReason = `Row ${rowNum}: ${failReason} (title="${title}", price=${price}, url="${affCode.substring(0, 30)}${affCode.length > 30 ? '...' : ''}")`;
          failReasons.push(detailedReason);
          
          // Log first few bad rows for debugging
          if (invalidRows <= 3) {
            console.error(`[import-csv] Row ${rowNum} FAILED:`, {
              rowNumber: rowNum,
              failReason,
              rowData: {
                title,
                price,
                affCode: affCode.substring(0, 50) + (affCode.length > 50 ? '...' : ''),
                storeName,
                availableFields: Object.keys(row).slice(0, 10)
              }
            });
          }
          continue;
        }

        // Auto-fix URL if missing protocol
        let fixedUrl = affCode;
        if (fixedUrl && !fixedUrl.startsWith('http')) {
          fixedUrl = 'https://' + fixedUrl;
        }

        validRows.push({
          title,
          affCode: fixedUrl,
          price: price as number,
          storeName,
          imageUrls,
          categoryRaw,
          currency,
          externalId
        });
      }

      // Log detailed skip reasons (first 10)
      if (failReasons.length > 0) {
        console.log(`[import-csv] Skip reasons (first 10 of ${failReasons.length}):`);
        failReasons.slice(0, 10).forEach((reason: string) => {
          console.log(`  - ${reason}`);
        });
      }

      const limitedRows = validRows.slice(0, MAX_IMPORT_ROWS);
      const ingested = limitedRows.length;
      const skipped = totalRows - ingested;

      if (limitedRows.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error:
              `Parsed ${normalizedRows.length} rows but 0 passed validation for 2Performant. ` +
              `Required fields: non-empty title, non-empty aff_code/affiliate link, numeric price > 0. ` +
              `Check that your CSV headers look like: title, aff_code, price, campaign_name, image_urls, description. ` +
              `Detected delimiter: "${delimiter}".`,
            totalRows: normalizedRows.length,
            ingested: 0,
            skipped: normalizedRows.length,
            createdProducts: 0,
            updatedProducts: 0,
            createdListings: 0,
            updatedListings: 0,
            skippedMissingFields: invalidRows,
            skippedMissingExternalId: 0,
            failedRows: invalidRows,
            validationErrors: [], // Rename to avoid duplicate 'errors' property
            truncated: isCapped,
            capped: isCapped,
            maxRowsPerImport: MAX_IMPORT_ROWS,
            provider,
            sampleRow: normalizedRows[0] ?? null,
            failReasons: failReasons.slice(0, 10), // Include first 10 skip reasons
          },
          { status: 400 },
        );
      }

      // Convert valid rows to NormalizedListing format
      const normalizedListings = limitedRows.map((row: TwoPerformantImportRow) => ({
        productTitle: row.title,
        brand: row.title.split(" ")[0] || "Unknown", // Simple brand extraction
        category: row.categoryRaw || "General",
        gtin: undefined,
        storeId: row.storeName?.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_") || "unknown",
        storeName: row.storeName || "Unknown",
        url: row.affCode,
        price: row.price,
        currency: row.currency || "RON",
        imageUrl: row.imageUrls, // Pass the extracted image URL
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
          ingested: processedRows, // Use ingested instead of processedRows
          skipped: skippedRows,
          createdProducts: summary.productsCreated,
          updatedProducts: summary.productsMatched,
          createdListings: summary.listingsCreated,
          updatedListings: summary.listingsUpdated,
          skippedMissingFields: invalidRows,
          skippedMissingExternalId: 0,
          failedRows,
          errors,
          truncated: isCapped,
          message,
          capped: isCapped,
          maxRowsPerImport: MAX_IMPORT_ROWS,
          provider,
          failReasons: failReasons.slice(0, 10), // Include first 10 skip reasons
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
