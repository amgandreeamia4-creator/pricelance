// src/app/api/admin/import-csv/route.ts
// CSV bulk import for Products + Listings (file upload)
// Supports Profitshare.ro CSV feeds

import { NextRequest, NextResponse } from "next/server";
import { validateAdminToken } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  parseProfitshareCsv,
  parseAvailability,
  type ProfitshareRow,
} from "@/lib/affiliates/profitshare";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 100;
const MAX_IMPORT_ROWS = 300;

// Use a loose-typed handle to silence TS while schema/types are in flux.
const db: any = prisma;

/**
 * Upsert a Product for a Profitshare row using (source, externalId) identity.
 * Returns the product ID and whether it was newly created.
 */
async function findOrCreateProduct(
  row: ProfitshareRow,
  source: string,
  externalId: string
): Promise<{ productId: string; isNew: boolean }> {
  // Check if product already exists by (source, externalId)
  const existing = await db.product.findUnique({
    where: {
      source_externalId: {
        source,
        externalId,
      },
    },
    select: { id: true },
  });

  const product = await db.product.upsert({
    where: {
      source_externalId: {
        source,
        externalId,
      },
    },
    create: {
      name: row.name,
      displayName: row.name,
      category: row.categoryRaw || null,
      brand: null,
      imageUrl: row.imageUrl || null,
      thumbnailUrl: row.imageUrl || null,
      gtin: row.gtin || null,
      source,
      externalId,
    },
    update: {
      ...(row.imageUrl && { imageUrl: row.imageUrl, thumbnailUrl: row.imageUrl }),
      ...(row.categoryRaw && { category: row.categoryRaw }),
      ...(row.gtin && { gtin: row.gtin }),
    },
    select: { id: true },
  });

  return { productId: product.id, isNew: !existing };
}

/**
 * Find or create a Listing for a product.
 * Identifies by (productId, storeName, affiliateUrl) combination.
 * Also stores imageUrl coming from the feed.
 */
async function upsertListing(
  productId: string,
  row: ProfitshareRow
): Promise<{ isNew: boolean }> {
  const inStock = parseAvailability(row.availability);
  const now = new Date();

  // Try to find existing listing by productId + storeName + affiliate URL
  const existing = await db.listing.findFirst({
    where: {
      productId,
      storeName: { equals: row.storeName, mode: "insensitive" },
      url: row.affiliateUrl,
    },
    select: { id: true },
  });

  if (existing) {
    await db.listing.update({
      where: { id: existing.id },
      data: {
        price: row.price,
        priceCents: Math.round(row.price * 100),
        currency: row.currency,
        inStock,
        source: "affiliate",
        affiliateProvider: "profitshare",
        priceLastSeenAt: now,
        ...(row.imageUrl && { imageUrl: row.imageUrl }),
      },
    });

    return { isNew: false };
  }

  // Create new listing
  await db.listing.create({
    data: {
      productId,
      storeName: row.storeName,
      url: row.affiliateUrl,
      price: row.price,
      priceCents: Math.round(row.price * 100),
      currency: row.currency,
      inStock,
      source: "affiliate",
      affiliateProvider: "profitshare",
      countryCode: "RO",
      priceLastSeenAt: now,
      imageUrl: row.imageUrl || null,
    },
  });

  return { isNew: true };
}

/**
 * Process a batch of rows. Each row is wrapped in try/catch so one failure
 * doesn't abort the entire import.
 */
async function processBatch(
  rows: ProfitshareRow[],
  startIdx: number
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
  let skippedMissingExternalId = 0;
  let failedRows = 0;
  const errors: { rowNumber: number; message: string; code: string | null }[] =
    [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = startIdx + i + 2; // +2 for 1-indexed and header row

    try {
      const source = "profitshare";

      // We treat feed "Product code" (mapped to row.sku) as externalId.
      const productCodeRaw = row.sku;
      const externalId = productCodeRaw ? String(productCodeRaw).trim() : "";

      if (!externalId) {
        skippedMissingExternalId++;
        continue;
      }

      // Product
      const { productId, isNew: isNewProduct } = await findOrCreateProduct(
        row,
        source,
        externalId
      );

      if (isNewProduct) {
        createdProducts++;
      } else {
        updatedProducts++;
      }

      // Listing
      const { isNew: isNewListing } = await upsertListing(productId, row);

      if (isNewListing) {
        createdListings++;
      } else {
        updatedListings++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const code = (err as any)?.code ?? null;
      errors.push({ rowNumber: rowNum, message, code });
      failedRows++;
      console.error(`[import-csv] Row ${rowNum} error:`, err);
    }
  }

  return {
    createdProducts,
    updatedProducts,
    createdListings,
    updatedListings,
    skippedMissingExternalId,
    failedRows,
    errors,
  };
}

/**
 * POST /api/admin/import-csv
 * Bulk import products and listings from a Profitshare CSV file.
 */
export async function POST(req: NextRequest) {
  // Validate admin token
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json(
      { ok: false, error: authError.error },
      { status: authError.status }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing CSV file" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { ok: false, error: "File must be a CSV file" },
        { status: 400 }
      );
    }

    const content = await file.text();

    if (!content.trim()) {
      return NextResponse.json(
        { ok: false, error: "CSV file is empty" },
        { status: 400 }
      );
    }

    // Parse CSV
    let parseResult;
    try {
      parseResult = parseProfitshareCsv(content);
    } catch (err) {
      console.error("[admin/import-csv] CSV parse error:", err);
      return NextResponse.json(
        { ok: false, error: "Failed to parse CSV" },
        { status: 500 }
      );
    }

    const { rows, skippedMissingFields, totalDataRows, headerError } =
      parseResult;

    if (headerError) {
      return NextResponse.json(
        { ok: false, error: headerError },
        { status: 400 }
      );
    }

    const totalRows = rows.length;
    const limitedRows = rows.slice(0, MAX_IMPORT_ROWS);
    const isCapped = totalRows > MAX_IMPORT_ROWS;

    console.log(
      `[import-csv] Starting import: totalRows=${totalRows}, processedRows=${limitedRows.length}, ` +
        `MAX_IMPORT_ROWS=${MAX_IMPORT_ROWS}, capped=${isCapped}`
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
        },
        { status: 200 }
      );
    }

    // Process in batches
    let createdProducts = 0;
    let updatedProducts = 0;
    let createdListings = 0;
    let updatedListings = 0;
    let failedRows = 0;
    let skippedMissingExternalId = 0;
    let errors: { rowNumber: number; message: string; code: string | null }[] =
      [];

    const startTime = Date.now();

    for (let i = 0; i < limitedRows.length; i += BATCH_SIZE) {
      const batch = limitedRows.slice(i, i + BATCH_SIZE);
      const batchResult = await processBatch(batch, i);

      createdProducts += batchResult.createdProducts;
      updatedProducts += batchResult.updatedProducts;
      createdListings += batchResult.createdListings;
      updatedListings += batchResult.updatedListings;
      failedRows += batchResult.failedRows;
      skippedMissingExternalId += batchResult.skippedMissingExternalId;
      errors.push(...batchResult.errors);
    }

    const durationMs = Date.now() - startTime;
    console.log(
      `[import-csv] Import complete: processedRows=${limitedRows.length}, ` +
        `created=${createdProducts}/${createdListings}, updated=${updatedProducts}/${updatedListings}, ` +
        `failed=${failedRows}, duration=${durationMs}ms`
    );

    if (errors.length > 50) {
      errors = errors.slice(0, 50);
    }

    const message = isCapped
      ? `Processed first ${limitedRows.length} rows out of ${totalRows}. Split your CSV and re-upload remaining rows.`
      : null;

    const skippedRows = skippedMissingFields + skippedMissingExternalId;

    return NextResponse.json(
      {
        ok: failedRows === 0,
        totalRows,
        processedRows: limitedRows.length,
        skippedRows,
        skipped: skippedRows,
        createdProducts,
        updatedProducts,
        createdListings,
        updatedListings,
        skippedMissingFields,
        skippedMissingExternalId,
        failedRows,
        failed: failedRows,
        errors,
        truncated: isCapped,
        message,
        capped: isCapped,
        maxRowsPerImport: MAX_IMPORT_ROWS,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[admin/import-csv] POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process CSV import" },
      { status: 500 }
    );
  }
}
