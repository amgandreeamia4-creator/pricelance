// src/lib/affiliates/twoPerformant.ts
// 2Performant CSV feed adapter – tuned for the current feed format.
//
// IMPORTANT: This is designed to work with the user's existing 2Performant CSV:
// - Name:           "Product name"
// - URLs:           "Product affiliate l", "Product link", and sometimes a 2P deeplink in "Category"
// - Prices:         "Price with discou", "Price with VAT", "Price without VA"
// - Currency:       "Currency"
// and similar variants.
//
// It returns rows compatible with the Profitshare importer so the rest of the
// pipeline (processBatch, findOrCreateProduct, upsertListing) can stay unchanged.

export type TwoPerformantRow = {
  name: string;
  productUrl: string;        // merchant product URL (if available)
  affiliateUrl: string;      // 2Performant deeplink (if available)
  imageUrl?: string;
  price: number;
  currency: string;
  categoryRaw?: string;
  sku?: string;
  gtin?: string;
  availability?: string;
  storeName: string;
  // Affiliate metadata specific to 2Performant
  affiliateProvider: string; // always "2performant"
  affiliateProgram?: string;
};

export type TwoPerformantParseResult = {
  ok: boolean;
  totalRows: number;
  processedRows: number;
  skippedRows: number;
  skipped: number;
  createdProducts: number;
  updatedProducts: number;
  createdListings: number;
  updatedListings: number;
  skippedMissingFields: number;
  skippedMissingExternalId: number;
  failedRows: number;
  failed: number;
  errors: { rowNumber: number; message: string; code: string | null }[];
  rows: TwoPerformantRow[];
  headerError?: string;
};

// Price header priority – first non-empty wins *per row*.
const PRICE_HEADER_CANDIDATES = [
  "price_with_discou", // "Price with discou" – discounted price (best)
  "price_with_vat",    // "Price with VAT"
  "price_without_va",  // "Price without VA"
  "price",             // generic
  "current_price",
  "pret",
  "final_price",
];

// Column name → TwoPerformantRow field.
// Keys here are *normalized* header names (see normalizeHeader).
const COLUMN_MAPPINGS: Record<string, keyof TwoPerformantRow | "currency" | "availability" | "affiliateProgram" | "categoryRaw" | "sku" | "gtin"> = {
  // Name
  "product_name": "name",
  "name": "name",
  "title": "name",

  // URLs
  "product_affiliate_l": "affiliateUrl", // 2Performant deeplink
  "product_link": "productUrl",          // merchant product URL
  "deeplink": "affiliateUrl",
  "affiliate_link": "affiliateUrl",
  "url": "productUrl",
  "link": "productUrl",

  // Image
  "product_picture": "imageUrl",
  "image_url": "imageUrl",
  "image": "imageUrl",
  "img": "imageUrl",

  // Store / merchant / advertiser
  "advertiser_name": "storeName",

  // Category
  "category": "categoryRaw",

  // SKU / product code
  "product_code": "sku",
  "sku": "sku",
  "code": "sku",

  // GTIN / barcode
  "gtin": "gtin",
  "ean": "gtin",
  "ean13": "gtin",
  "barcode": "gtin",

  // Availability
  "availability": "availability",
  "stock": "availability",
  "in_stock": "availability",

  // Currency
  "currency": "currency",

  // Price-ish columns – we still use PRICE_HEADER_CANDIDATES per row,
  // but mapping them to "price" lets getCell() fetch them if needed.
  "price_with_discou": "price",
  "price_with_vat": "price",
  "price_without_va": "price",
  "price": "price",
  "current_price": "price",
  "pret": "price",
  "final_price": "price",

  // Program / campaign
  "program_name": "affiliateProgram",
  "program": "affiliateProgram",
  "campaign": "affiliateProgram",
  "campaign_name": "affiliateProgram",
};

/**
 * Normalize a header name: lowercase, trim, replace spaces/dashes with underscores,
 * strip other non-word chars.
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w_]/g, "");
}

/**
 * Parse CSV content into rows.
 * Handles quoted fields and both comma / semicolon delimiters.
 */
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  const cleanContent = content.replace(/^\uFEFF/, ""); // strip BOM
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
        } else if (char === "," || char === ";") {
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

/**
 * Build header index map from the first row.
 * Maps TwoPerformantRow fields to their column indices.
 */
function buildHeaderMap(headerRow: string[]): Map<keyof TwoPerformantRow | "currency" | "availability" | "affiliateProgram" | "categoryRaw" | "sku" | "gtin", number> {
  const map = new Map<keyof TwoPerformantRow | "currency" | "availability" | "affiliateProgram" | "categoryRaw" | "sku" | "gtin", number>();

  for (let i = 0; i < headerRow.length; i++) {
    const normalized = normalizeHeader(headerRow[i]);
    const mappedField = COLUMN_MAPPINGS[normalized];
    if (mappedField && !map.has(mappedField)) {
      map.set(mappedField, i);
    }
  }

  return map;
}

/**
 * Get a cell value from a row by mapped field.
 */
function getCell(
  row: string[],
  headerMap: Map<keyof TwoPerformantRow | "currency" | "availability" | "affiliateProgram" | "categoryRaw" | "sku" | "gtin", number>,
  field: keyof TwoPerformantRow | "currency" | "availability" | "affiliateProgram" | "categoryRaw" | "sku" | "gtin"
): string {
  const idx = headerMap.get(field);
  if (idx === undefined || idx < 0 || idx >= row.length) return "";
  return (row[idx] ?? "").toString().trim();
}

/**
 * Parse a price string to a number.
 * Handles Romanian format (1.234,56) and international format (1,234.56).
 */
function parsePrice(priceStr: string): number | null {
  if (!priceStr || !priceStr.trim()) return null;

  let cleaned = priceStr.trim();

  // Remove currency symbols and spaces
  cleaned = cleaned.replace(/[^\d.,\-]/g, "");
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma > lastDot && cleaned.length - lastComma <= 4) {
    // Romanian format: 1.234,56
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma && cleaned.length - lastDot <= 4) {
    // International format: 1,234.56
    cleaned = cleaned.replace(/,/g, "");
  } else {
    // Fallback: strip commas
    cleaned = cleaned.replace(/,/g, "");
  }

  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Extract host from URL and strip "www." prefix.
 */
function extractHost(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/**
 * Validate that essential columns are present in the header.
 * For 2Performant we only require:
 * - a name column
 * - Price validation happens per-row since we have smart fallback
 */
function validateHeaders(
  headerRow: string[],
  headerMap: Map<keyof TwoPerformantRow | "currency" | "availability" | "affiliateProgram" | "categoryRaw" | "sku" | "gtin", number>
): string | null {
  const missing: string[] = [];

  if (!headerMap.has("name")) {
    missing.push("Product name");
  }

  if (missing.length > 0) {
    return `Missing required columns: ${missing.join(", ")}`;
  }

  return null;
}

/**
 * Parse 2Performant CSV content into normalized rows.
 * - Uses Product name as product name.
 * - Pulls URLs from Product affiliate l / Product link / 2P deeplink column.
 * - For each row, scans Price with discou → Price with VAT → Price without VA
 *   (and other price-like headers) to find a usable price.
 */
export function parseTwoPerformantCsv(content: string): TwoPerformantParseResult {
  const csvRows = parseCsv(content);

  if (csvRows.length < 2) {
    return {
      ok: true,
      totalRows: 0,
      processedRows: 0,
      skippedRows: 0,
      skipped: 0,
      createdProducts: 0,
      updatedProducts: 0,
      createdListings: 0,
      updatedListings: 0,
      skippedMissingFields: 0,
      skippedMissingExternalId: 0,
      failedRows: 0,
      failed: 0,
      errors: [],
      rows: [],
    };
  }

  const headerRow = csvRows[0];
  const headerMap = buildHeaderMap(headerRow);

  console.log('[2Performant] Detected headers:', headerRow);
  console.log('[2Performant] Header map keys:', Array.from(headerMap.keys()));

  const headerError = validateHeaders(headerRow, headerMap);
  if (headerError) {
    return {
      ok: false,
      totalRows: csvRows.length - 1,
      processedRows: 0,
      skippedRows: 0,
      skipped: 0,
      createdProducts: 0,
      updatedProducts: 0,
      createdListings: 0,
      updatedListings: 0,
      skippedMissingFields: 0,
      skippedMissingExternalId: 0,
      failedRows: 0,
      failed: 0,
      errors: [],
      rows: [],
      headerError,
    };
  }

  // Build list of price candidate column indices in priority order.
  const priceCandidateIndices: number[] = [];
  for (let col = 0; col < headerRow.length; col++) {
    const norm = normalizeHeader(headerRow[col]);
    if (PRICE_HEADER_CANDIDATES.includes(norm)) {
      priceCandidateIndices.push(col);
      console.log(`[2Performant] Found price candidate: "${headerRow[col]}" -> ${norm} at column ${col}`);
    }
  }

  console.log(`[2Performant] Total price candidates found: ${priceCandidateIndices.length}`);

  const rows: TwoPerformantRow[] = [];
  let skippedMissingFields = 0;

  console.log(`[2Performant] Processing ${csvRows.length - 1} data rows`);
  
  // Show first 3 rows for debugging
  for (let i = 1; i <= Math.min(4, csvRows.length - 1); i++) {
    console.log(`[2Performant] Row ${i}:`, csvRows[i]);
  }

  for (let i = 1; i < csvRows.length; i++) {
    const rawRow = csvRows[i];

    // Skip empty lines quickly
    if (!rawRow || rawRow.every((c) => !c || !c.toString().trim())) {
      continue;
    }

    const name = getCell(rawRow, headerMap, "name");

    // URLs from mapped fields
    let affiliateUrl = getCell(rawRow, headerMap, "affiliateUrl");
    let productUrl = getCell(rawRow, headerMap, "productUrl");
    const categoryRaw = getCell(rawRow, headerMap, "categoryRaw");

    // Sometimes the "Category" column contains the 2Performant deeplink.
    if (!affiliateUrl && categoryRaw && categoryRaw.startsWith("http")) {
      affiliateUrl = categoryRaw;
    }

    // If we still don't have an affiliateUrl but productUrl looks like a 2P link, treat it as such.
    if (!affiliateUrl && productUrl && /2performant|event\./i.test(productUrl)) {
      affiliateUrl = productUrl;
    }

    // If productUrl is empty but affiliateUrl looks like a merchant URL (no 2performant in it),
    // keep affiliateUrl as is and later we derive store from it. Otherwise, we keep productUrl
    // as the merchant URL when present.
    if (!productUrl && affiliateUrl && !/2performant|event\./i.test(affiliateUrl)) {
      productUrl = affiliateUrl;
    }

    // PRICE: try mapped "price" first, then fall back to candidates per row.
    let priceStr = getCell(rawRow, headerMap, "price");

    if (!priceStr && priceCandidateIndices.length > 0) {
      for (const colIdx of priceCandidateIndices) {
        const raw = (rawRow[colIdx] ?? "").toString().trim();
        if (raw) {
          priceStr = raw;
          break;
        }
      }
    }

    // Critical field checks - only require name and price, URL is optional
    if (!name || !priceStr) {
      console.log(`[2Performant] Row ${i+2} skipped - name: ${!!name}, priceStr: ${!!priceStr}`);
      skippedMissingFields++;
      continue;
    }

    const price = parsePrice(priceStr);
    if (price === null) {
      console.log(`[2Performant] Row ${i+2} skipped - invalid price: "${priceStr}"`);
      skippedMissingFields++;
      continue;
    }

    const imageUrl = getCell(rawRow, headerMap, "imageUrl") || undefined;
    const currencyCell = getCell(rawRow, headerMap, "currency");
    const currency = (currencyCell || "RON").toUpperCase();

    const sku = getCell(rawRow, headerMap, "sku") || undefined;
    const gtin = getCell(rawRow, headerMap, "gtin") || undefined;
    const availability = getCell(rawRow, headerMap, "availability") || undefined;
    const affiliateProgram = getCell(rawRow, headerMap, "affiliateProgram") || undefined;

    // Store name: prefer explicit advertiser_name; if missing, derive from productUrl or affiliateUrl.
    let storeName = getCell(rawRow, headerMap, "storeName");
    if (!storeName) {
      storeName = extractHost(productUrl) || extractHost(affiliateUrl) || "unknown";
    }

    rows.push({
      name,
      productUrl: productUrl || affiliateUrl || "", // allow empty if no URL
      affiliateUrl: affiliateUrl || productUrl || "", // allow empty if no URL
      imageUrl,
      price,
      currency,
      categoryRaw: categoryRaw || undefined,
      sku,
      gtin,
      availability,
      storeName,
      affiliateProvider: "2performant",
      affiliateProgram,
    });
  }

  return {
    ok: skippedMissingFields === 0,
    totalRows: csvRows.length - 1,
    processedRows: rows.length,
    skippedRows: skippedMissingFields,
    skipped: skippedMissingFields,
    createdProducts: 0,
    updatedProducts: 0,
    createdListings: 0,
    updatedListings: 0,
    skippedMissingFields,
    skippedMissingExternalId: 0,
    failedRows: skippedMissingFields,
    failed: skippedMissingFields,
    errors: [],
    rows,
  };
}

/**
 * Simple availability parser, reused by the importer if needed.
 */
export function parseAvailability(availability: string | undefined): boolean {
  if (!availability) return true;

  const lower = availability.toLowerCase().trim();
  const outPatterns = [
    "out of stock",
    "indisponibil",
    "stoc epuizat",
    "nu este in stoc",
    "0",
    "false",
    "no",
  ];

  for (const p of outPatterns) {
    if (lower.includes(p)) return false;
  }

  return true;
}