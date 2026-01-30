import "dotenv/config";
import fs from "node:fs/promises";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { parseProfitshareCsv, type ProfitshareRow, parseAvailability } from "@/lib/affiliates/profitshare";
import { detectBrandFromName } from "@/lib/brandDetector";

const BATCH_SIZE = 100;

/**
 * Find or create a Product based on name (and optional category).
 * Legacy path for Profitshare rows.
 */
async function findOrCreateProduct(
  row: ProfitshareRow,
): Promise<{ productId: string; isNew: boolean }> {
  const existing = await prisma.product.findFirst({
    where: {
      name: row.name,
    },
    select: { id: true },
  });

  if (!existing) {
    const detectedBrand = detectBrandFromName(row.name);
    const created = await prisma.product.create({
      data: {
        // NOTE: Product.id is required in Prisma schema, so we generate it here.
        id: crypto.randomUUID(),
        name: row.name,
        displayName: row.name,
        category: row.categoryRaw || null,
        brand: detectedBrand || "Unknown",
        imageUrl: row.imageUrl || null,
        thumbnailUrl: row.imageUrl || null,
        gtin: row.gtin || null,
        updatedAt: new Date(),
      },
      select: { id: true },
    });
    return { productId: created.id, isNew: true };
  }

  const updated = await prisma.product.update({
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

  const existing = await prisma.listing.findFirst({
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
    await prisma.listing.update({
      where: { id: existing.id },
      data: listingData,
    });
    return { isNew: false, hasListing: true };
  }

  await prisma.listing.create({
    data: {
      id: crypto.randomUUID(),
      productId,
      storeName: row.storeName,
      url: row.affiliateUrl,
      updatedAt: new Date(),
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
      console.error("[profitshare-bulk] Row failed", {
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

async function main() {
  const [,, csvPath] = process.argv;
  if (!csvPath) {
    console.error("Usage: ts-node scripts/import-profitshare-bulk.ts path/to/file.csv");
    process.exit(1);
  }

  console.log("[profitshare-bulk] Starting bulk import from:", csvPath);

  const content = await fs.readFile(csvPath, "utf8");
  if (!content.trim()) {
    console.error("[profitshare-bulk] CSV file is empty");
    process.exit(1);
  }

  const parseResult = parseProfitshareCsv(content);
  const { rows, skippedMissingFields, headerError, totalDataRows } = parseResult;

  if (headerError) {
    console.error("[profitshare-bulk] Header error:", headerError);
    console.error("[profitshare-bulk] Total data rows (excluding header):", totalDataRows);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log("[profitshare-bulk] No valid rows after parsing. SkippedMissingFields:", skippedMissingFields);
    process.exit(0);
  }

  const adaptedRows = rows as ProfitshareRow[];
  const affiliateMetadata = adaptedRows.map(() => ({
    provider: "profitshare",
    program: undefined,
  }));

  console.log("[profitshare-bulk] Parsed rows:", adaptedRows.length, "skippedMissingFields:", skippedMissingFields);

  let createdProductsTotal = 0;
  let updatedProductsTotal = 0;
  let createdListingsTotal = 0;
  let updatedListingsTotal = 0;
  let failedRowsTotal = 0;
  let allErrors: { rowNumber: number; message: string; code: string | null }[] = [];

  const startTime = Date.now();

  for (let i = 0; i < adaptedRows.length; i += BATCH_SIZE) {
    const batch = adaptedRows.slice(i, i + BATCH_SIZE);
    const batchMetadata = affiliateMetadata.slice(i, i + BATCH_SIZE);

    console.log(`[profitshare-bulk] Processing batch starting at row index ${i} (batch size: ${batch.length})`);

    const batchResult = await processBatch(batch, batchMetadata, i);

    createdProductsTotal += batchResult.createdProducts;
    updatedProductsTotal += batchResult.updatedProducts;
    createdListingsTotal += batchResult.createdListings;
    updatedListingsTotal += batchResult.updatedListings;
    failedRowsTotal += batchResult.failedRows;
    allErrors.push(...batchResult.errors);
  }

  const durationMs = Date.now() - startTime;

  if (allErrors.length > 100) {
    allErrors = allErrors.slice(0, 100);
  }

  console.log("--------------------------------------------------");
  console.log("[profitshare-bulk] Import complete");
  console.log("  Total parsed rows         :", adaptedRows.length);
  console.log("  Skipped missing fields    :", skippedMissingFields);
  console.log("  Created products          :", createdProductsTotal);
  console.log("  Updated products          :", updatedProductsTotal);
  console.log("  Created listings          :", createdListingsTotal);
  console.log("  Updated listings          :", updatedListingsTotal);
  console.log("  Failed rows               :", failedRowsTotal);
  console.log("  Duration ms               :", durationMs);
  console.log("--------------------------------------------------");

  if (allErrors.length > 0) {
    console.log("[profitshare-bulk] Sample errors (up to 100):");
    for (const e of allErrors) {
      console.log(`  Row ${e.rowNumber}: ${e.message}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[profitshare-bulk] Fatal error:", err);
  prisma.$disconnect().finally(() => {
    process.exit(1);
  });
});
