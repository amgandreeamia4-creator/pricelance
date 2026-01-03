// src/lib/affiliates/twoPerformant.ts
// 2Performant CSV feed adapter

/**
 * Normalized row from 2Performant CSV feed.
 * Maps 2Performant-specific columns to a canonical internal shape.
 * This matches the shape returned by parseProfitshareCsv for compatibility.
 */
export type TwoPerformantRow = {
  name: string;
  productUrl: string;
  affiliateUrl: string;
  imageUrl?: string;
  price: number;
  currency: string;
  categoryRaw?: string;
  sku?: string;
  gtin?: string;
  availability?: string;
  storeName: string;
  // Affiliate metadata specific to 2Performant
  affiliateProvider: string;
  affiliateProgram?: string;
};

/**
 * Result summary from 2Performant CSV import.
 * Matches the shape returned by parseProfitshareCsv.
 */
export type TwoPerformantImportResult = {
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
};

/**
 * Possible 2Performant CSV column name variations (normalized to lowercase, spaces/dashes to underscores).
 */
const COLUMN_MAPPINGS: Record<string, keyof TwoPerformantRow> = {
  // Name variations
  name: "name",
  product_name: "name",
  title: "name",
  product_title: "name",
  product: "name",
  
  // Product URL variations (use deeplink as primary)
  deeplink: "affiliateUrl",
  tracking_link: "affiliateUrl",
  url: "affiliateUrl",
  link: "affiliateUrl",
  product_url: "affiliateUrl",
  affiliate_link: "affiliateUrl",
  // 2Performant feed variants used in our current sheet:
  product_affiliate_l: "affiliateUrl",
  product_link: "affiliateUrl",
  
  // Image URL variations
  image_url: "imageUrl",
  image: "imageUrl",
  img: "imageUrl",
  picture: "imageUrl",
  product_image: "imageUrl",
  product_picture: "imageUrl",
  
  // Price variations – just to tell us these are price-ish columns.
  // We will still use PRICE_HEADER_CANDIDATES per row to pick the actual value.
  price_with_discou: "price",
  price_with_vat: "price",
  price_without_va: "price",
  price: "price",
  current_price: "price",
  pret: "price",
  final_price: "price",
  
  // Currency variations
  currency: "currency",
  moneda: "currency",
  valuta: "currency",
  
  // Category variations
  category: "categoryRaw",
  categorie: "categoryRaw",
  product_category: "categoryRaw",
  
  // SKU variations
  sku: "sku",
  product_code: "sku",
  cod_produs: "sku",
  code: "sku",
  id: "sku",
  product_id: "sku",
  
  // GTIN / barcode variations
  gtin: "gtin",
  ean: "gtin",
  ean13: "gtin",
  barcode: "gtin",
  
  // Availability variations
  availability: "availability",
  stock: "availability",
  in_stock: "availability",
  disponibilitate: "availability",
  stoc: "availability",
  
  // Store/Merchant variations
  merchant: "storeName",
  store: "storeName",
  store_name: "storeName",
  merchant_name: "storeName",
  
  // Program/Campaign variations
  program_name: "affiliateProgram",
  program: "affiliateProgram",
  campaign: "affiliateProgram",
  campaign_name: "affiliateProgram",
};

/**
 * Price header candidates in priority order for 2Performant feeds.
 * We'll try these in order per row to find the first non-empty price.
 */
const PRICE_HEADER_CANDIDATES = [
  "price_with_discou", // "Price with discou" – discounted price (best)
  "price_with_vat",    // "Price with VAT"
  "price_without_va",  // "Price without VA"
  "price",             // generic
  "current_price",
  "pret",
  "final_price",
];

/**
 * Normalize a header name: lowercase, trim, replace spaces/dashes with underscores.
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w_]/g, "");
}

/**
 * Extract store name from a URL's domain.
 * e.g., "https://www.emag.ro/laptop-xyz" -> "emag.ro"
 */
function extractStoreFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove 'www.' prefix if present
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

/**
 * Parse a price string to a number.
 * Handles Romanian format (1.234,56) and international format (1,234.56).
 */
function parsePrice(priceStr: string): number | null {
  if (!priceStr || !priceStr.trim()) return null;
  
  let cleaned = priceStr.trim();
  
  // Remove currency symbols and whitespace
  cleaned = cleaned.replace(/[^\d.,\-]/g, "");
  
  if (!cleaned) return null;
  
  // Detect format: if last separator is comma and has 2-3 digits after, it's decimal
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  
  if (lastComma > lastDot && cleaned.length - lastComma <= 4) {
    // Romanian format: 1.234,56 -> replace . with nothing, , with .
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma && cleaned.length - lastDot <= 4) {
    // International format: 1,234.56 -> remove commas
    cleaned = cleaned.replace(/,/g, "");
  } else {
    // No decimal separator or ambiguous, just remove commas
    cleaned = cleaned.replace(/,/g, "");
  }
  
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Parse CSV content into rows.
 * Handles quoted fields and various line endings.
 */
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  // Remove BOM if present
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
        } else if (char === "," || char === ";") {
          // Support both comma and semicolon as delimiters
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
 * Maps normalized column names to their indices.
 */
function buildHeaderMap(headerRow: string[]): Map<keyof TwoPerformantRow, number> {
  const map = new Map<keyof TwoPerformantRow, number>();
  
  for (let i = 0; i < headerRow.length; i++) {
    const normalized = normalizeHeader(headerRow[i]);
    const mappedField = COLUMN_MAPPINGS[normalized];
    
    if (mappedField && !map.has(mappedField)) {
      map.set(mappedField, i);
    }
  }
  
  // Fallback: auto-detect an image column if none was mapped explicitly
  if (!map.has("imageUrl")) {
    for (let i = 0; i < headerRow.length; i++) {
      const normalized = normalizeHeader(headerRow[i]);
      if (
        normalized.includes("image") ||
        normalized.includes("picture") ||
        normalized.includes("poza") ||
        normalized.includes("imagine")
      ) {
        map.set("imageUrl", i);
        break;
      }
    }
  }
  
  return map;
}

/**
 * Get a cell value from a row by field name.
 */
function getCell(
  row: string[],
  headerMap: Map<keyof TwoPerformantRow, number>,
  field: keyof TwoPerformantRow
): string {
  const idx = headerMap.get(field);
  if (idx === undefined || idx >= row.length) return "";
  return (row[idx] ?? "").trim();
}

/**
 * Validate that required columns exist in the header.
 * Returns an error message if validation fails, or null if valid.
 */
function validateHeaders(headerMap: Map<keyof TwoPerformantRow, number>): string | null {
  const missing: string[] = [];
  
  // Must have name
  if (!headerMap.has("name")) {
    missing.push("name");
  }
  
  // Must have price
  if (!headerMap.has("price")) {
    missing.push("price");
  }
  
  // Must have deeplink/url
  if (!headerMap.has("affiliateUrl")) {
    missing.push("deeplink/url");
  }
  
  if (missing.length > 0) {
    return `Missing required columns: ${missing.join(", ")}`;
  }
  
  return null;
}

/**
 * Parse 2Performant CSV content into normalized rows.
 * Returns an array of valid rows and skipped count.
 * Throws an error if required columns are missing from the header.
 */
export function parseTwoPerformantCsv(content: string): {
  rows: TwoPerformantRow[];
  skippedMissingFields: number;
  totalDataRows: number;
  headerError?: string;
} {
  const csvRows = parseCsv(content);
  
  if (csvRows.length < 2) {
    return { rows: [], skippedMissingFields: 0, totalDataRows: 0 };
  }
  
  const headerMap = buildHeaderMap(csvRows[0]);
  
  // Build a prioritized list of column indices that look like price columns
  const headerRow = csvRows[0];
  const priceCandidateIndices: number[] = [];
  for (let col = 0; col < headerRow.length; col++) {
    const normalized = normalizeHeader(headerRow[col]);
    const candidateIndex = PRICE_HEADER_CANDIDATES.indexOf(normalized);
    if (candidateIndex !== -1) {
      // Insert into priceCandidateIndices based on priority in PRICE_HEADER_CANDIDATES
      // so we preserve "discounted > with VAT > without VAT > others"
      priceCandidateIndices.push(col);
    }
  }
  
  // If no affiliateUrl column was detected from headers, try to auto-detect it from data
  if (!headerMap.has("affiliateUrl")) {
    const maxRowsToCheck = Math.min(20, csvRows.length - 1);
    const scores: number[] = new Array(csvRows[0].length).fill(0);

    for (let rowIndex = 1; rowIndex <= maxRowsToCheck; rowIndex++) {
      const row = csvRows[rowIndex];
      if (!row) continue;

      for (let col = 0; col < row.length; col++) {
        const value = (row[col] ?? "").toString().trim();
        if (!value) continue;
        // Only consider URL-ish values
        if (value.startsWith("http://") || value.startsWith("https://")) {
          scores[col]++;

          // Bonus score if it looks like a 2Performant deeplink
          if (value.includes("2performant") || value.includes("event.")) {
            scores[col] += 2;
          }
        }
      }
    }

    let bestCol = -1;
    let bestScore = 0;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > bestScore) {
        bestScore = scores[i];
        bestCol = i;
      }
    }

    // Only set affiliateUrl if we found a plausible URL column
    if (bestCol >= 0 && bestScore > 0) {
      headerMap.set("affiliateUrl", bestCol);
    }
  }
  
  // Validate required columns exist in header
  const headerError = validateHeaders(headerMap);
  if (headerError) {
    return { rows: [], skippedMissingFields: 0, totalDataRows: csvRows.length - 1, headerError };
  }
  
  const rows: TwoPerformantRow[] = [];
  let skippedMissingFields = 0;
  
  // Process data rows (skip header)
  for (let i = 1; i < csvRows.length; i++) {
    const rawRow = csvRows[i];
    
    // Skip empty rows
    if (!rawRow || rawRow.every((cell) => !cell.trim())) {
      continue;
    }
    
    const name = getCell(rawRow, headerMap, "name");
    const affiliateUrl = getCell(rawRow, headerMap, "affiliateUrl");
    
    // Try mapped "price" first, if buildHeaderMap found one
    let priceStr = getCell(rawRow, headerMap, "price");

    // Fallback: if that is empty, scan all known price columns in priority order
    if (!priceStr && priceCandidateIndices.length > 0) {
      for (const colIdx of priceCandidateIndices) {
        const raw = (rawRow[colIdx] ?? "").toString().trim();
        if (raw) {
          priceStr = raw;
          break;
        }
      }
    }

    // Check critical fields
    if (!name || !affiliateUrl || !priceStr) {
      skippedMissingFields++;
      continue;
    }
    
    const price = parsePrice(priceStr);
    if (price === null) {
      skippedMissingFields++;
      continue;
    }
    
    // Extract store name from affiliate URL
    const storeName = extractStoreFromUrl(affiliateUrl);
    
    const currency = getCell(rawRow, headerMap, "currency") || "RON";
    const imageUrl = getCell(rawRow, headerMap, "imageUrl") || undefined;
    const categoryRaw = getCell(rawRow, headerMap, "categoryRaw") || undefined;
    const sku = getCell(rawRow, headerMap, "sku") || undefined;
    const gtin = getCell(rawRow, headerMap, "gtin") || undefined;
    const availability = getCell(rawRow, headerMap, "availability") || undefined;
    const affiliateProgram = getCell(rawRow, headerMap, "affiliateProgram") || undefined;
    
    rows.push({
      name,
      productUrl: affiliateUrl, // Use affiliate URL as product URL for 2Performant
      affiliateUrl,
      imageUrl,
      price,
      currency: currency.toUpperCase(),
      categoryRaw,
      sku,
      gtin,
      availability,
      storeName,
      affiliateProvider: "2performant",
      affiliateProgram,
    });
  }
  
  return {
    rows,
    skippedMissingFields,
    totalDataRows: csvRows.length - 1, // Exclude header
  };
}

/**
 * Check if availability string indicates in-stock.
 * Reuses the same logic as Profitshare for consistency.
 */
export function parseAvailability(availability: string | undefined): boolean {
  if (!availability) return true; // Default to in-stock
  
  const lower = availability.toLowerCase().trim();
  
  // Common out-of-stock indicators
  const outOfStockPatterns = [
    "out of stock",
    "indisponibil",
    "stoc epuizat",
    "nu este in stoc",
    "0",
    "false",
    "no",
  ];
  
  for (const pattern of outOfStockPatterns) {
    if (lower.includes(pattern)) return false;
  }
  
  return true;
}
