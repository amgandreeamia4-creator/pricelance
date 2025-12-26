// src/app/api/admin/import-csv/route.ts
// CSV bulk import for Products + Listings (file upload)
// Safe, schema-light version: only uses fields we know exist,
// and adds product.imageUrl so the UI can finally show images.

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

// Use loose typing to avoid TS complaining if schema drifts
const db: any = prisma;

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
 */
async function upsertListing(
  productId: string,
  row: ProfitshareRow,
): Promise<{ isNew: boolean }> {
  const inStock = parseAvailability(row.availability);

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
      },
    });
    return { isNew: false };
  }

  await db.listing.create({
    data: {
      productId,
      storeName: row.storeName,
      url: row.affiliateUrl,
      price: row.price,
      priceCents: Math.round(row.price * 100),
      currency: row.currency,
      inStock,
    },
  });

  return { isNew: true };
}

/**
 * Process a batch of rows – errors are collected per row.
 */
async function processBatch(
  rows: ProfitshareRow[],
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
  const errors: { rowNumber: number; message: string; code: string | null }[] =
    [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = startIdx + i + 2; // +2 for header + 1-index

    try {
      // 1) Product
      const { productId, isNew: isNewProduct } = await findOrCreateProduct(row);
      if (isNewProduct) createdProducts++;
      else updatedProducts++;

      // 2) Listing
      const { isNew: isNewListing } = await upsertListing(productId, row);
      if (isNewListing) createdListings++;
      else updatedListings++;
    } catch (err: any) {
      failedRows++;
      errors.push({
        rowNumber: rowNum,
        message: err?.message || "Unknown error",
        code: err?.code ?? null,
      });
      console.error(`[import-csv] Row ${rowNum} error:`, err);
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

    // 2) Parse CSV
    let parseResult;
    try {
      parseResult = parseProfitshareCsv(content);
    } catch (err) {
      console.error("[admin/import-csv] CSV parse error:", err);
      return NextResponse.json(
        { ok: false, error: "Failed to parse CSV" },
        { status: 500 },
      );
    }

    const { rows, skippedMissingFields, totalDataRows, headerError } =
      parseResult;

    if (headerError) {
      return NextResponse.json(
        { ok: false, error: headerError },
        { status: 400 },
      );
    }

    const totalRows = rows.length;
    const limitedRows = rows.slice(0, MAX_IMPORT_ROWS);
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
      const batchResult = await processBatch(batch, i);

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
        skippedMissingExternalId: 0,
        failedRows,
        failed: failedRows,
        errors,
        truncated: isCapped,
        message,
        capped: isCapped,
        maxRowsPerImport: MAX_IMPORT_ROWS,
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