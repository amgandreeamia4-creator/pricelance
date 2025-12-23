// src/lib/affiliates/fakeAffiliateAdapter.ts
// =============================================================================
// FAKE AFFILIATE ADAPTER - Test/Demo Only
// =============================================================================
//
// This adapter is for testing the affiliate architecture ONLY.
// It does NOT connect to any real affiliate network.
//
// Purpose:
// - Prove the adapter pattern works end-to-end
// - Test CSV → NormalizedListing → importNormalizedListings flow
// - Validate affiliate metadata (affiliateProvider, merchantOriginalId)
//
// Expected CSV format (different from Google Sheet to prove adapter pattern):
// affiliate_product_name,affiliate_brand,affiliate_category,gtin,merchant_id,merchant_name,deeplink,price,currency,delivery_days,fast_delivery,in_stock
// =============================================================================

import type { AffiliateAdapter, NormalizedListing } from "./types";
import { BaseAffiliateAdapter, parseBooleanLike, parseNumberLike } from "./base";

// Required columns for the fake affiliate CSV format
const REQUIRED_COLUMNS = [
  "affiliate_product_name",
  "affiliate_brand",
  "affiliate_category",
  "merchant_name",
  "deeplink",
  "price",
  "currency",
] as const;

const OPTIONAL_COLUMNS = [
  "gtin",
  "merchant_id",
  "delivery_days",
  "fast_delivery",
  "in_stock",
] as const;

const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as const;

type ColumnName = (typeof ALL_COLUMNS)[number];

/**
 * Simple CSV parser (reuses logic pattern from googleSheet adapter)
 */
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  const cleanContent = content.replace(/^\uFEFF/, "");
  const lines = cleanContent.split(/\r?\n/);

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
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          row.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }

    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

function buildHeaderIndices(headerRow: string[]): Record<ColumnName, number> {
  const header = headerRow.map((h) => h.toLowerCase().trim().replace(/^\uFEFF/, ""));

  const missingRequired = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
  if (missingRequired.length > 0) {
    throw new Error(`Missing required columns: ${missingRequired.join(", ")}`);
  }

  const indices: Record<ColumnName, number> = {} as Record<ColumnName, number>;
  for (const col of ALL_COLUMNS) {
    indices[col] = header.indexOf(col);
  }

  return indices;
}

function getCell(row: string[], indices: Record<ColumnName, number>, column: ColumnName): string {
  const idx = indices[column];
  if (typeof idx !== "number" || idx < 0 || idx >= row.length) return "";
  return (row[idx] ?? "").toString().trim();
}

/**
 * Normalize merchant_name to a storeId format (lowercase, underscores)
 */
function normalizeStoreId(merchantName: string): string {
  return merchantName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
}

/**
 * Check if a row has valid listing data (URL + positive price)
 */
function isListingCapable(url: string, priceRaw: string): boolean {
  if (!url || !url.trim()) return false;
  const price = parseNumberLike(priceRaw);
  return price != null && Number.isFinite(price) && price > 0;
}

function normalizeRows(rows: string[][]): NormalizedListing[] {
  if (rows.length < 2) {
    throw new Error("CSV must have a header row and at least one data row");
  }

  const headerIndices = buildHeaderIndices(rows[0]);
  const normalized: NormalizedListing[] = [];

  for (let i = 1; i < rows.length; i++) {
    const rawRow = rows[i];
    if (!rawRow || rawRow.length === 0 || rawRow.every((cell) => !cell || !cell.trim())) {
      continue;
    }

    try {
      // Map affiliate CSV columns to NormalizedListing fields
      const productTitle = getCell(rawRow, headerIndices, "affiliate_product_name");
      const brand = getCell(rawRow, headerIndices, "affiliate_brand");
      const category = getCell(rawRow, headerIndices, "affiliate_category");
      const gtin = getCell(rawRow, headerIndices, "gtin");
      const merchantId = getCell(rawRow, headerIndices, "merchant_id");
      const merchantName = getCell(rawRow, headerIndices, "merchant_name");
      const deeplink = getCell(rawRow, headerIndices, "deeplink");
      const priceRaw = getCell(rawRow, headerIndices, "price");
      const currencyRaw = getCell(rawRow, headerIndices, "currency");
      const deliveryDaysRaw = getCell(rawRow, headerIndices, "delivery_days");
      const fastDeliveryRaw = getCell(rawRow, headerIndices, "fast_delivery");
      const inStockRaw = getCell(rawRow, headerIndices, "in_stock");

      // Skip rows without product title
      if (!productTitle) {
        continue;
      }

      // Skip rows without brand or category
      if (!brand && !category) {
        continue;
      }

      const storeId = normalizeStoreId(merchantName || merchantId || "unknown");
      const deliveryDays = deliveryDaysRaw ? parseInt(deliveryDaysRaw, 10) : NaN;
      const fastDelivery = parseBooleanLike(fastDeliveryRaw);
      const inStock = parseBooleanLike(inStockRaw);

      // Check if this row is listing-capable
      const listingCapable = isListingCapable(deeplink, priceRaw);

      if (listingCapable) {
        const price = parseNumberLike(priceRaw)!;
        normalized.push({
          productTitle,
          brand: brand || "",
          category: category || "",
          gtin: gtin || undefined,
          storeId,
          storeName: merchantName || merchantId || "Unknown Store",
          url: deeplink,
          price,
          currency: currencyRaw ? currencyRaw.toUpperCase() : "RON",
          deliveryDays: Number.isFinite(deliveryDays) ? deliveryDays : undefined,
          fastDelivery,
          inStock,
          source: "affiliate",
        });
      } else {
        // Product-only row
        normalized.push({
          productTitle,
          brand: brand || "",
          category: category || "",
          gtin: gtin || undefined,
          source: "affiliate",
        });
      }
    } catch (err) {
      console.error("[fakeAffiliateAdapter] Failed to normalize row", i + 1, err);
    }
  }

  return normalized;
}

class FakeAffiliateAdapter extends BaseAffiliateAdapter implements AffiliateAdapter {
  id = "fake-affiliate";
  name = "Fake Affiliate (Test Only)";

  /**
   * Normalize fake affiliate CSV data into NormalizedListing[].
   * This is a TEST adapter - it does not connect to any real affiliate network.
   */
  normalize(raw: string): NormalizedListing[] {
    if (!raw || !raw.trim()) return [];
    const rows = parseCsv(raw);
    return normalizeRows(rows);
  }
}

export const fakeAffiliateAdapter: AffiliateAdapter = new FakeAffiliateAdapter();
