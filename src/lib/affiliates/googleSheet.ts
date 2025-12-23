import type { AffiliateAdapter, NormalizedListing } from "./types";
import { BaseAffiliateAdapter, parseBooleanLike, parseNumberLike } from "./base";

// Product columns are always required for any row
const PRODUCT_COLUMNS = [
  "product_title",
  "brand",
  "category",
] as const;

// Listing columns are required for listing-capable rows, but optional for product-only rows
const LISTING_COLUMNS = [
  "store_id",
  "store_name",
  "listing_url",
  "price",
  "currency",
] as const;

// All required columns that must exist in the header
const REQUIRED_COLUMNS = [
  ...PRODUCT_COLUMNS,
  ...LISTING_COLUMNS,
] as const;

const OPTIONAL_COLUMNS = [
  "gtin",
  "delivery_days",
  "fast_delivery",
  "in_stock",
  "country_code",
] as const;

const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as const;

type ColumnName = (typeof ALL_COLUMNS)[number];

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
 * Determines if a row has enough data to create a Listing.
 * A row is "listing-capable" if it has both:
 * - a non-empty listing_url (string, not just whitespace)
 * - a valid numeric price (parseable as a number, not NaN, > 0)
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
      // Product fields (required for any row)
      const productTitle = getCell(rawRow, headerIndices, "product_title");
      const brand = getCell(rawRow, headerIndices, "brand");
      const category = getCell(rawRow, headerIndices, "category");

      // Skip rows that don't have minimum product identity
      // A row needs at least product_title AND (brand OR category)
      if (!productTitle) {
        // Row has no product_title - will be reported as error by importer
        // Still include it so the importer can report the specific error
        normalized.push({
          productTitle: "",
          brand: brand || "",
          category: category || "",
          source: "sheet",
        });
        continue;
      }

      if (!brand && !category) {
        // Has product_title but no brand or category - include for error reporting
        normalized.push({
          productTitle,
          brand: "",
          category: "",
          source: "sheet",
        });
        continue;
      }

      // Listing fields (optional - determines if this is listing-capable or product-only)
      const storeId = getCell(rawRow, headerIndices, "store_id");
      const storeName = getCell(rawRow, headerIndices, "store_name");
      const url = getCell(rawRow, headerIndices, "listing_url");
      const priceRaw = getCell(rawRow, headerIndices, "price");
      const currencyRaw = getCell(rawRow, headerIndices, "currency");

      // Optional fields
      const deliveryDaysRaw = getCell(rawRow, headerIndices, "delivery_days");
      const fastDeliveryRaw = getCell(rawRow, headerIndices, "fast_delivery");
      const inStockRaw = getCell(rawRow, headerIndices, "in_stock");
      const gtinRaw = getCell(rawRow, headerIndices, "gtin");
      const countryCodeRaw = getCell(rawRow, headerIndices, "country_code");

      const deliveryDays = deliveryDaysRaw
        ? Number.parseInt(deliveryDaysRaw, 10)
        : Number.NaN;
      const fastDelivery = parseBooleanLike(fastDeliveryRaw);
      const inStock = parseBooleanLike(inStockRaw);

      // Check if this row is listing-capable
      const listingCapable = isListingCapable(url, priceRaw);

      if (listingCapable) {
        // Full listing row - include all listing fields
        const price = parseNumberLike(priceRaw)!;
        const normalizedListing: NormalizedListing = {
          productTitle,
          brand: brand || "",
          category: category || "",
          gtin: gtinRaw || undefined,
          storeId: storeId || undefined,
          storeName: storeName || undefined,
          url,
          price,
          currency: currencyRaw ? currencyRaw.toUpperCase() : undefined,
          deliveryDays: Number.isFinite(deliveryDays) ? deliveryDays : undefined,
          fastDelivery,
          inStock,
          countryCode: countryCodeRaw ? countryCodeRaw.toUpperCase() : undefined,
          source: "sheet",
        };
        normalized.push(normalizedListing);
      } else {
        // Product-only row - only include product fields
        const normalizedListing: NormalizedListing = {
          productTitle,
          brand: brand || "",
          category: category || "",
          gtin: gtinRaw || undefined,
          // Listing fields are undefined for product-only rows
          source: "sheet",
        };
        normalized.push(normalizedListing);
      }
    } catch (err) {
      console.error("[googleSheetAdapter] Failed to normalize row", i + 1, err);
    }
  }

  return normalized;
}

class GoogleSheetAdapter extends BaseAffiliateAdapter implements AffiliateAdapter {
  id = "google-sheet";
  name = "Google Sheet CSV";

  normalize(raw: string): NormalizedListing[] {
    if (!raw || !raw.trim()) return [];
    const rows = parseCsv(raw);
    return normalizeRows(rows);
  }
}

export const googleSheetAdapter: AffiliateAdapter = new GoogleSheetAdapter();
