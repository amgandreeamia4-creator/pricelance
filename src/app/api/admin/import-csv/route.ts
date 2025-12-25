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
  type ProfitshareImportResult,
} from "@/lib/affiliates/profitshare";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 100;
const MAX_ROWS_PER_IMPORT = 1000;

/**
 * Find or create a Product by URL first, then by SKU if available.
 * Returns the product ID and whether it was newly created.
 */
async function findOrCreateProduct(
  row: ProfitshareRow
): Promise<{ productId: string; isNew: boolean }> {
  // Strategy 1: Try to find by product URL
  const existingByUrl = await (prisma.product.findFirst as any)({
    where: {
      listings: {
        some: {
          url: row.productUrl,
        },
      },
    },
    select: { id: true },
  });

  if (existingByUrl) {
    // Update product fields if provided
    if (row.imageUrl || row.categoryRaw) {
      await (prisma.product.update as any)({
        where: { id: existingByUrl.id },
        data: {
          ...(row.imageUrl && { imageUrl: row.imageUrl }),
          ...(row.categoryRaw && { category: row.categoryRaw }),
        },
      });
    }
    return { productId: existingByUrl.id, isNew: false };
  }

  // Strategy 2: Try to find by name (case-insensitive)
  const existingByName = await (prisma.product.findFirst as any)({
    where: {
      name: { equals: row.name, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (existingByName) {
    // Update product fields if provided
    if (row.imageUrl || row.categoryRaw) {
      await (prisma.product.update as any)({
        where: { id: existingByName.id },
        data: {
          ...(row.imageUrl && !existingByName.imageUrl && { imageUrl: row.imageUrl }),
          ...(row.categoryRaw && { category: row.categoryRaw }),
        },
      });
    }
    return { productId: existingByName.id, isNew: false };
  }

  // Strategy 3: Create new product
  const created = await (prisma.product.create as any)({
    data: {
      name: row.name,
      category: row.categoryRaw || null,
      imageUrl: row.imageUrl || null,
    },
  });

  return { productId: created.id, isNew: true };
}

/**
 * Find or create a Listing for a product.
 * Identifies by (productId, storeName, affiliateUrl) combination.
 */
async function upsertListing(
  productId: string,
  row: ProfitshareRow
): Promise<{ isNew: boolean }> {
  const inStock = parseAvailability(row.availability);
  const now = new Date();

  // Try to find existing listing by productId + storeName + affiliate URL
  const existing = await (prisma.listing.findFirst as any)({
    where: {
      productId,
      storeName: { equals: row.storeName, mode: "insensitive" },
      url: row.affiliateUrl,
    },
    select: { id: true },
  });

  if (existing) {
    // Update existing listing
    await (prisma.listing.update as any)({
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
  await (prisma.listing.create as any)({
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
      ...(row.imageUrl && { imageUrl: row.imageUrl }),
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
  failedRows: number;
  errors: { rowNumber: number; message: string; code: string | null }[];
}> {
  let createdProducts = 0;
  let updatedProducts = 0;
  let createdListings = 0;
  let updatedListings = 0;
  let failedRows = 0;
  const errors: { rowNumber: number; message: string; code: string | null }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = startIdx + i + 2; // +2 for 1-indexed and header row

    try {
      // Find or create product
      const { productId, isNew: isNewProduct } = await findOrCreateProduct(row);

      if (isNewProduct) {
        createdProducts++;
      } else {
        updatedProducts++;
      }

      // Upsert listing
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

    // Validate file presence
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

    const { rows, skippedMissingFields, totalDataRows, headerError } = parseResult;

    // Return error if required columns are missing from header
    if (headerError) {
      return NextResponse.json(
        { ok: false, error: headerError },
        { status: 400 }
      );
    }

    // Cap rows to avoid timeout
    const totalRows = totalDataRows;
    const validRows = rows.length;
    const limitedRows = rows.slice(0, MAX_ROWS_PER_IMPORT);
    const isCapped = validRows > MAX_ROWS_PER_IMPORT;

    console.log(
      `[import-csv] Starting import: totalRows=${totalRows}, validRows=${validRows}, ` +
      `processedRows=${limitedRows.length}, MAX_ROWS_PER_IMPORT=${MAX_ROWS_PER_IMPORT}, capped=${isCapped}`
    );

    if (limitedRows.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          totalRows,
          processedRows: limitedRows.length,
          createdProducts: 0,
          updatedProducts: 0,
          createdListings: 0,
          updatedListings: 0,
          skippedMissingFields,
          failedRows: 0,
          errors: [],
          truncated: false,
          message: null,
          capped: isCapped,
          maxRowsPerImport: MAX_ROWS_PER_IMPORT,
        },
        { status: 200 }
      );
    }

    // Start timing
    const startTime = Date.now();

    // Process in batches
    let createdProducts = 0;
    let updatedProducts = 0;
    let createdListings = 0;
    let updatedListings = 0;
    let failedRows = 0;
    let errors: { rowNumber: number; message: string; code: string | null }[] = [];

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

    // End timing
    const durationMs = Date.now() - startTime;
    console.log(
      `[import-csv] Import complete: processedRows=${limitedRows.length}, ` +
      `created=${createdProducts}/${createdListings}, updated=${updatedProducts}/${updatedListings}, ` +
      `failed=${failedRows}, duration=${durationMs}ms`
    );

    // Limit errors in response to prevent huge payloads
    if (errors.length > 50) {
      errors = errors.slice(0, 50);
    }

    const message = isCapped
      ? `Processed first ${limitedRows.length} rows out of ${totalRows}. Split your CSV and re-upload remaining rows.`
      : null;

    return NextResponse.json(
      {
        ok: failedRows === 0,
        totalRows,
        processedRows: limitedRows.length,
        createdProducts,
        updatedProducts,
        createdListings,
        updatedListings,
        skippedMissingFields,
        failedRows,
        errors,
        truncated: isCapped,
        message,
        capped: isCapped,
        maxRowsPerImport: MAX_ROWS_PER_IMPORT,
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
