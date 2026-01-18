// src/lib/affiliates/twoPerformant.ts
// =============================================================================
// 2PERFORMANT CSV FEED ADAPTER - CANONICAL FOR YOUR SHEET
// =============================================================================
//
// Tailored to the concrete 2Performant CSV you showed:
//
//   A: Advertiser name
//   B: Category
//   C: Manufacturer
//   D: Product code
//   E: Product name
//   F: Product descript
//   G: Product affiliate l
//   H: Product link
//   I: Product picture
//   J: Price without VA(T)
//   K: Price with VAT
//   L: Price with discou(nt)
//   M: Currency
//
// It:
//
// - Parses CSV using a generic splitter that treats both "," and ";" as separators
//   (so we don't guess the delimiter incorrectly).
// - Locates headers using .includes() instead of strict .startsWith().
// - For each data row, requires ONLY:
//     * Product name (E) non-empty
//     * At least one price column (J/K/L) non-empty and parseable
// - URL is not required at parser level (importNormalizedListings decides
//   whether the row is "listing-capable").
//
// Returns TwoPerformantRow[] plus some counters.
//
// =============================================================================

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
  totalRows: number;          // number of data rows (excluding header)
  processedRows: number;      // rows that became TwoPerformantRow
  skippedRows: number;        // rows skipped due to missing/invalid name/price
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

/**
 * Generic CSV parser:
 * - Strips BOM
 * - Splits on newlines
 * - Splits each line on "," or ";" (both treated as delimiters)
 * - Handles quotes and escaped quotes
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
 * Safe cell getter by index.
 */
function cell(row: string[], idx: number | undefined): string {
  if (idx === undefined || idx < 0 || idx >= row.length) return "";
  return (row[idx] ?? "").toString().trim();
}

/**
 * Parse a price string into a number.
 * Handles:
 * - "1.234,56"  → 1234.56
 * - "1,234.56"  → 1234.56
 * - "1234"      → 1234
 */
function parsePrice(priceStr: string): number | null {
  if (!priceStr || !priceStr.trim()) return null;

  let cleaned = priceStr.trim();

  // Remove currency symbols and text
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
    // Fallback: just strip commas
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
 * Main parser for 2Performant CSV.
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
  const lowerHeaders = headerRow.map((h) => h.toLowerCase().trim());

  const idxAdvertiser = lowerHeaders.findIndex((h) => h.includes("advertiser name")) || -1;
  const idxCategory = lowerHeaders.findIndex((h) => h.includes("category")) || -1;
  const idxProductName = lowerHeaders.findIndex((h) => h.includes("product name") || h.includes("nume produs") || h.includes("product_name")) || -1;
  const idxAffiliate = lowerHeaders.findIndex((h) => h.includes("product affiliate") || h.includes("affiliate_link") || h.includes("product_url") || h.includes("affiliate_url")) || -1;
  const idxProductLink = lowerHeaders.findIndex((h) => h.includes("product link") || h.includes("product_url") || h.includes("affiliate_link") || h.includes("affiliate_url") || h.includes("product_url_2performant")) || -1;
  const idxPicture = lowerHeaders.findIndex((h) => h.includes("product picture")) || -1;
  const idxPriceDisc = lowerHeaders.findIndex((h) => h.includes("price with discou")) || -1;
  const idxPriceVat = lowerHeaders.findIndex((h) => h.includes("price with vat")) || -1;
  const idxPriceWithout = lowerHeaders.findIndex((h) => h.includes("price without va")) || -1;
  const idxCurrency = lowerHeaders.findIndex((h) => h.includes("currency")) || -1;
  const idxAvailability = lowerHeaders.findIndex((h) => h.includes("availability")) || -1;

  if (idxProductName === -1) {
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
      headerError: "Missing required column: Product name",
    };
  }

  const totalDataRows = csvRows.length - 1;
  const rows: TwoPerformantRow[] = [];
  let skippedMissingFields = 0;

  for (let i = 1; i < csvRows.length; i++) {
    const rawRow = csvRows[i];
    const rowNumber = i + 1; // 1-based including header

    // Skip fully empty line
    if (!rawRow || rawRow.every((c) => !c || !c.toString().trim())) {
      continue;
    }

    const name = cell(rawRow, idxProductName);
    if (!name) {
      skippedMissingFields++;
      continue;
    }

    // Price: try discou → VAT → without VA, first non-empty
    const priceDisc = cell(rawRow, idxPriceDisc);
    const priceVat = cell(rawRow, idxPriceVat);
    const priceWithout = cell(rawRow, idxPriceWithout);

    const priceStr = priceDisc || priceVat || priceWithout;

    if (!priceStr) {
      skippedMissingFields++;
      continue;
    }

    const price = parsePrice(priceStr);
    if (price === null) {
      skippedMissingFields++;
      continue;
    }

    const affiliateUrl = cell(rawRow, idxAffiliate);
    const productUrl = cell(rawRow, idxProductLink);
    const categoryRaw = cell(rawRow, idxCategory) || undefined;
    const imageUrl = cell(rawRow, idxPicture) || undefined;
    const currencyCell = cell(rawRow, idxCurrency);
    const currency = (currencyCell || "RON").toUpperCase();

    let storeName = cell(rawRow, idxAdvertiser);
    if (!storeName) {
      storeName =
        extractHost(productUrl) ||
        extractHost(affiliateUrl) ||
        "unknown";
    }

    rows.push({
      name,
      productUrl: productUrl || affiliateUrl || "",
      affiliateUrl: affiliateUrl || productUrl || "",
      imageUrl,
      price,
      currency,
      categoryRaw,
      sku: undefined,
      gtin: undefined,
      availability: undefined,
      storeName,
      affiliateProvider: "2performant",
      affiliateProgram: undefined,
    });
  }

  const processedRows = rows.length;
  const skippedRows = skippedMissingFields;
  const ok = processedRows > 0 && skippedRows === 0;

  return {
    ok,
    totalRows: totalDataRows,
    processedRows,
    skippedRows,
    skipped: skippedRows,
    createdProducts: 0,
    updatedProducts: 0,
    createdListings: 0,
    updatedListings: 0,
    skippedMissingFields,
    skippedMissingExternalId: 0,
    failedRows: skippedRows,
    failed: skippedRows,
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