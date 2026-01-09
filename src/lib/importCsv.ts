// src/lib/importCsv.ts
// =============================================================================
// LEGACY - DO NOT USE FOR NEW IMPORTS
// =============================================================================
//
// This file is DEPRECATED and retained only for reference.
// All new imports MUST use the core ingestion pipeline:
//   src/lib/importService.ts → importNormalizedListings()
//
// The current import architecture uses adapters that normalize data
// before calling the shared importNormalizedListings() function.
// See: src/lib/affiliates/googleSheet.ts for the active adapter.
//
// This legacy code bypasses validation, product-only row handling,
// and other improvements in the new pipeline.
// =============================================================================

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export type ImportSummary = {
  productsCreated: number;
  productsMatched: number;
  listingsCreated: number;
  listingsUpdated: number;
  errors: { rowNumber: number; message: string }[];
};

type CsvRow = {
  product_title: string;
  brand: string;
  category: string;
  gtin: string;
  store_id: string;
  store_name: string;
  listing_url: string;
  price: string;
  currency: string;
  delivery_days: string;
  fast_delivery: string;
  in_stock: string;
};

const REQUIRED_COLUMNS = [
  "product_title",
  "brand",
  "category",
  "store_id",
  "store_name",
  "listing_url",
  "price",
  "currency",
] as const;

const ALL_COLUMNS = [
  "product_title",
  "brand",
  "category",
  "gtin",
  "store_id",
  "store_name",
  "listing_url",
  "price",
  "currency",
  "delivery_days",
  "fast_delivery",
  "in_stock",
] as const;

/**
 * Simple CSV parser that handles quoted fields and commas within quotes.
 * Accepts a full CSV string and returns an array of rows (string arrays).
 */
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  // Remove BOM if present (UTF-8 BOM: \uFEFF)
  const cleanContent = content.replace(/^\uFEFF/, "");
  const lines = cleanContent.split(/\r?\n/);

  console.log("[CSV Parser] Total lines:", lines.length);

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else if (char === '"') {
          // End of quoted field
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          // Start of quoted field
          inQuotes = true;
        } else if (char === ",") {
          // Field separator
          row.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }
    // Push the last field
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Parse CSV rows into typed objects.
 */
function parseRows(rawRows: string[][]): { rows: CsvRow[]; headerError?: string } {
  if (rawRows.length < 2) {
    return { rows: [], headerError: "CSV must have a header row and at least one data row" };
  }

  const header = rawRows[0].map((h) => h.toLowerCase().trim().replace(/^\uFEFF/, ""));

  console.log("[CSV Parser] Header columns:", header);

  // Validate all expected columns exist
  const missingColumns = ALL_COLUMNS.filter((col) => !header.includes(col));
  if (missingColumns.length > 0) {
    return {
      rows: [],
      headerError: `Missing required columns: ${missingColumns.join(", ")}`,
    };
  }

  // Map column indices
  const columnIndices: Record<string, number> = {};
  for (const col of ALL_COLUMNS) {
    columnIndices[col] = header.indexOf(col);
  }

  // Parse data rows
  const rows: CsvRow[] = [];
  for (let i = 1; i < rawRows.length; i++) {
    const rawRow = rawRows[i];
    if (rawRow.length === 0 || (rawRow.length === 1 && !rawRow[0])) continue;

    const row: CsvRow = {
      product_title: rawRow[columnIndices["product_title"]] || "",
      brand: rawRow[columnIndices["brand"]] || "",
      category: rawRow[columnIndices["category"]] || "",
      gtin: rawRow[columnIndices["gtin"]] || "",
      store_id: rawRow[columnIndices["store_id"]] || "",
      store_name: rawRow[columnIndices["store_name"]] || "",
      listing_url: rawRow[columnIndices["listing_url"]] || "",
      price: rawRow[columnIndices["price"]] || "",
      currency: rawRow[columnIndices["currency"]] || "",
      delivery_days: rawRow[columnIndices["delivery_days"]] || "",
      fast_delivery: rawRow[columnIndices["fast_delivery"]] || "",
      in_stock: rawRow[columnIndices["in_stock"]] || "",
    };
    rows.push(row);
  }

  return { rows };
}

/**
 * Validate a single row has all required fields.
 */
function validateRow(row: CsvRow): string | null {
  for (const col of REQUIRED_COLUMNS) {
    const value = row[col];
    if (!value || !value.trim()) {
      return `Missing required field: ${col}`;
    }
  }

  // Validate price is a valid number
  const price = parseFloat(row.price);
  if (isNaN(price) || price < 0) {
    return `Invalid price value: "${row.price}"`;
  }

  return null;
}

/**
 * Parse boolean string value.
 */
function parseBoolean(value: string): boolean | null {
  const lower = value.toLowerCase().trim();
  if (lower === "true" || lower === "1" || lower === "yes") return true;
  if (lower === "false" || lower === "0" || lower === "no") return false;
  return null;
}

/**
 * Parse integer string value.
 */
function parseIntOrNull(value: string): number | null {
  if (!value || !value.trim()) return null;
  const parsed = parseInt(value.trim(), 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Core CSV import function.
 * Accepts raw CSV content as a string and performs Product + Listing upserts.
 */
export async function importCsvString(csvContent: string): Promise<ImportSummary> {
  if (!csvContent.trim()) {
    throw new Error("CSV content is empty");
  }

  const rawRows = parseCsv(csvContent);
  const { rows, headerError } = parseRows(rawRows);

  if (headerError) {
    console.error("[importCsvString] Header error:", headerError);
    throw new Error(headerError);
  }

  console.log("[importCsvString] Parsed rows count:", rows.length);

  const summary: ImportSummary = {
    productsCreated: 0,
    productsMatched: 0,
    listingsCreated: 0,
    listingsUpdated: 0,
    errors: [],
  };

  if (rows.length === 0) {
    return summary;
  }

  // Cache for product lookups to avoid repeated DB queries
  // Key: "brand|name" (lowercase), Value: product ID
  const productCache = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // +2 because row 1 is header, and we're 1-indexed
    const row = rows[i];

    try {
      const validationError = validateRow(row);
      if (validationError) {
        console.log(`[importCsvString] Row ${rowNumber} validation error:`, validationError);
        summary.errors.push({ rowNumber, message: validationError });
        continue;
      }

      const productName = row.product_title.trim();
      const brand = row.brand.trim();
      const category = row.category.trim();
      const storeId = row.store_id.trim();
      const storeName = row.store_name.trim();
      const listingUrl = row.listing_url.trim();
      const price = parseFloat(row.price);
      const currency = row.currency.trim().toUpperCase();
      const deliveryDays = parseIntOrNull(row.delivery_days);
      const fastDelivery = parseBoolean(row.fast_delivery);
      const inStock = parseBoolean(row.in_stock);

      console.log(`[importCsvString] Processing row ${rowNumber}: ${productName} (${brand})`);

      // 1. Find or create Product
      const cacheKey = `${brand.toLowerCase()}|${productName.toLowerCase()}`;
      let productId = productCache.get(cacheKey);

      if (!productId) {
        const existingProduct = await prisma.product.findFirst({
          where: {
            brand: { equals: brand, mode: "insensitive" },
            name: { equals: productName, mode: "insensitive" },
          },
          select: { id: true },
        });

        if (existingProduct) {
          productId = existingProduct.id;
          summary.productsMatched++;
          console.log(`[importCsvString] Product MATCHED: ${productName} (id: ${productId})`);
        } else {
          const newProduct = await prisma.product.create({
            data: {
              id: randomUUID(),
              name: productName,
              brand,
              category,
              updatedAt: new Date(),
            },
          });
          productId = newProduct.id;
          summary.productsCreated++;
          console.log(`[importCsvString] Product CREATED: ${productName} (id: ${productId})`);
        }

        productCache.set(cacheKey, productId);
      } else {
        console.log(`[importCsvString] Product from CACHE: ${productName}`);
      }

      // 2. Find or create Listing
      // Note: current schema doesn't have storeId; using storeName + url + productId as uniqueness proxy.
      const existingListing = await prisma.listing.findFirst({
        where: {
          productId,
          storeName: { equals: storeName, mode: "insensitive" },
          url: listingUrl,
        },
        select: { id: true },
      });

      const now = new Date();

      if (existingListing) {
        // Relax Prisma typing for new metadata fields
        await (prisma.listing.update as any)({
          where: { id: existingListing.id },
          data: {
            price,
            currency,
            deliveryTimeDays: deliveryDays,
            fastDelivery,
            inStock: inStock ?? true,
            priceLastSeenAt: now,
          },
        });
        summary.listingsUpdated++;
        console.log(`[importCsvString] Listing UPDATED: ${storeName} @ ${price} ${currency}`);
      } else {
        // Relax Prisma typing for new metadata fields
        await (prisma.listing.create as any)({
          data: {
            id: randomUUID(),
            productId,
            storeName,
            url: listingUrl,
            price,
            currency,
            deliveryTimeDays: deliveryDays,
            fastDelivery,
            inStock: inStock ?? true,
            priceLastSeenAt: now,
            updatedAt: new Date(),
          },
        });
        summary.listingsCreated++;
        console.log(`[importCsvString] Listing CREATED: ${storeName} @ ${price} ${currency}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[importCsvString] Row ${rowNumber} error:`, err);
      summary.errors.push({ rowNumber, message });
    }
  }

  console.log("[importCsvString] Final summary:", summary);
  return summary;
}
