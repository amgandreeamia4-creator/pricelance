// src/lib/affiliates/profitshare.ts
// Profitshare.ro CSV feed adapter

/**
 * Normalized row from Profitshare CSV feed.
 * Maps Profitshare-specific columns to a canonical internal shape.
 */
export type ProfitshareRow = {
  name: string;
  productUrl: string;
  affiliateUrl: string;
  imageUrl?: string;
  price: number;
  currency: string;
  categoryRaw?: string;
  sku?: string;
  availability?: string;
  storeName: string;
};

/**
 * Result summary from Profitshare CSV import.
 */
export type ProfitshareImportResult = {
  ok: boolean;
  totalRows: number;
  processedRows: number;
  createdProducts: number;
  updatedProducts: number;
  createdListings: number;
  updatedListings: number;
  skippedMissingFields: number;
  errors: { row: number; message: string }[];
};

/**
 * Possible Profitshare CSV column name variations (normalized to lowercase, spaces/dashes to underscores).
 */
const COLUMN_MAPPINGS: Record<string, keyof ProfitshareRow> = {
  // Name variations
  product_name: "name",
  name: "name",
  title: "name",
  product_title: "name",
  denumire: "name",
  denumire_produs: "name",
  
  // Product URL variations
  product_url: "productUrl",
  url: "productUrl",
  link: "productUrl",
  product_link: "productUrl",
  link_produs: "productUrl",
  
  // Affiliate URL variations
  affiliate_link: "affiliateUrl",
  affiliate_url: "affiliateUrl",
  aff_link: "affiliateUrl",
  profitshare_link: "affiliateUrl",
  link_afiliat: "affiliateUrl",
  tracking_link: "affiliateUrl",
  
  // Image URL variations
  image_url: "imageUrl",
  image: "imageUrl",
  img: "imageUrl",
  imagine: "imageUrl",
  poza: "imageUrl",
  
  // Price variations
  price: "price",
  pret: "price",
  price_with_vat: "price",
  pret_cu_tva: "price",
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
  
  // Availability variations
  availability: "availability",
  disponibilitate: "availability",
  stock: "availability",
  in_stock: "availability",
  stoc: "availability",
};

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
 * Extract store name from a product URL's domain.
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
function buildHeaderMap(headerRow: string[]): Map<keyof ProfitshareRow, number> {
  const map = new Map<keyof ProfitshareRow, number>();
  
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
 * Get a cell value from a row by field name.
 */
function getCell(
  row: string[],
  headerMap: Map<keyof ProfitshareRow, number>,
  field: keyof ProfitshareRow
): string {
  const idx = headerMap.get(field);
  if (idx === undefined || idx >= row.length) return "";
  return (row[idx] ?? "").trim();
}

/**
 * Validate that required columns exist in the header.
 * Returns an error message if validation fails, or null if valid.
 */
function validateHeaders(headerMap: Map<keyof ProfitshareRow, number>): string | null {
  const missing: string[] = [];
  
  // Must have product_name (mapped to "name")
  if (!headerMap.has("name")) {
    missing.push("product_name");
  }
  
  // Must have price
  if (!headerMap.has("price")) {
    missing.push("price");
  }
  
  // Must have at least one of product_url or affiliate_link
  if (!headerMap.has("productUrl") && !headerMap.has("affiliateUrl")) {
    missing.push("product_url or affiliate_link");
  }
  
  if (missing.length > 0) {
    return `Missing required columns: ${missing.join(", ")}`;
  }
  
  return null;
}

/**
 * Parse Profitshare CSV content into normalized rows.
 * Returns an array of valid rows and skipped count.
 * Throws an error if required columns are missing from the header.
 */
export function parseProfitshareCsv(content: string): {
  rows: ProfitshareRow[];
  skippedMissingFields: number;
  totalDataRows: number;
  headerError?: string;
} {
  const csvRows = parseCsv(content);
  
  if (csvRows.length < 2) {
    return { rows: [], skippedMissingFields: 0, totalDataRows: 0 };
  }
  
  const headerMap = buildHeaderMap(csvRows[0]);
  
  // Validate required columns exist in header
  const headerError = validateHeaders(headerMap);
  if (headerError) {
    return { rows: [], skippedMissingFields: 0, totalDataRows: csvRows.length - 1, headerError };
  }
  
  const rows: ProfitshareRow[] = [];
  let skippedMissingFields = 0;
  
  // Process data rows (skip header)
  for (let i = 1; i < csvRows.length; i++) {
    const rawRow = csvRows[i];
    
    // Skip empty rows
    if (!rawRow || rawRow.every((cell) => !cell.trim())) {
      continue;
    }
    
    const name = getCell(rawRow, headerMap, "name");
    const productUrl = getCell(rawRow, headerMap, "productUrl");
    const affiliateUrl = getCell(rawRow, headerMap, "affiliateUrl");
    const priceStr = getCell(rawRow, headerMap, "price");
    
    // Check critical fields
    if (!name || (!productUrl && !affiliateUrl) || !priceStr) {
      skippedMissingFields++;
      continue;
    }
    
    const price = parsePrice(priceStr);
    if (price === null) {
      skippedMissingFields++;
      continue;
    }
    
    // Extract store name from product URL (or affiliate URL as fallback)
    const urlForStore = productUrl || affiliateUrl;
    const storeName = extractStoreFromUrl(urlForStore);
    
    const currency = getCell(rawRow, headerMap, "currency") || "RON";
    const imageUrl = getCell(rawRow, headerMap, "imageUrl") || undefined;
    const categoryRaw = getCell(rawRow, headerMap, "categoryRaw") || undefined;
    const sku = getCell(rawRow, headerMap, "sku") || undefined;
    const availability = getCell(rawRow, headerMap, "availability") || undefined;
    
    rows.push({
      name,
      productUrl: productUrl || affiliateUrl,
      affiliateUrl: affiliateUrl || productUrl,
      imageUrl,
      price,
      currency: currency.toUpperCase(),
      categoryRaw,
      sku,
      availability,
      storeName,
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
