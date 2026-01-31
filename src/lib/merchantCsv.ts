import { parse } from 'csv-parse/sync';
import { prisma } from './db';

export interface MerchantCsvRow {
  productTitle: string;
  brand: string;
  category: string;
  url: string;
  price: number;
  currency: string;
  gtin?: string;
  imageUrl?: string;
  deliveryDays?: number;
  inStock?: boolean;
}

export interface CsvProcessResult {
  success: boolean;
  rowsTotal: number;
  rowsSuccess: number;
  rowsError: number;
  errors: string[];
  listingIds: string[];
}

/**
 * Parse and validate CSV content
 */
export function parseMerchantCsv(csvContent: string): {
  success: boolean;
  rows: MerchantCsvRow[];
  errors: string[];
} {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const rows: MerchantCsvRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2; // +2 because CSV is 1-indexed and has headers

      try {
        const validatedRow = validateCsvRow(record, rowNum);
        rows.push(validatedRow);
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Invalid data'}`);
      }
    }

    return {
      success: errors.length === 0,
      rows,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      rows: [],
      errors: [`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Validate a single CSV row
 */
function validateCsvRow(record: any, rowNum: number): MerchantCsvRow {
  const errors: string[] = [];

  // Required fields
  const productTitle = record.productTitle?.trim();
  if (!productTitle) {
    errors.push('productTitle is required');
  }

  const brand = record.brand?.trim() || '';
  const category = record.category?.trim() || '';

  const url = record.url?.trim();
  if (!url) {
    errors.push('url is required');
  } else if (!isValidUrl(url)) {
    errors.push('url must be a valid URL');
  }

  const priceStr = record.price?.toString().trim();
  if (!priceStr) {
    errors.push('price is required');
  }
  const price = parseFloat(priceStr || '0');
  if (isNaN(price) || price <= 0) {
    errors.push('price must be a positive number');
  }

  const currency = record.currency?.trim().toUpperCase() || 'RON';
  if (!/^[A-Z]{3}$/.test(currency)) {
    errors.push('currency must be a 3-letter code (e.g., RON, USD)');
  }

  // Optional fields
  const gtin = record.gtin?.trim() || undefined;
  const imageUrl = record.imageUrl?.trim() || undefined;
  if (imageUrl && !isValidUrl(imageUrl)) {
    errors.push('imageUrl must be a valid URL if provided');
  }

  const deliveryDaysStr = record.deliveryDays?.toString().trim();
  let deliveryDays: number | undefined;
  if (deliveryDaysStr) {
    deliveryDays = parseInt(deliveryDaysStr, 10);
    if (isNaN(deliveryDays) || deliveryDays < 0) {
      errors.push('deliveryDays must be a non-negative integer');
    }
  }

  let inStock: boolean | undefined;
  if (record.inStock !== undefined && record.inStock !== '') {
    const inStockStr = record.inStock?.toString().toLowerCase().trim();
    if (['true', '1', 'yes', 'y'].includes(inStockStr)) {
      inStock = true;
    } else if (['false', '0', 'no', 'n'].includes(inStockStr)) {
      inStock = false;
    } else {
      errors.push('inStock must be true/false, 1/0, or yes/no');
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  return {
    productTitle,
    brand,
    category,
    url,
    price,
    currency,
    gtin,
    imageUrl,
    deliveryDays,
    inStock,
  };
}

/**
 * Process validated CSV rows and create listings in the database
 */
export async function processMerchantListings(
  rows: MerchantCsvRow[],
  merchantId: string,
  storeName: string
): Promise<CsvProcessResult> {
  const result: CsvProcessResult = {
    success: true,
    rowsTotal: rows.length,
    rowsSuccess: 0,
    rowsError: 0,
    errors: [],
    listingIds: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    try {
      // Create or update product
      const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const product = await prisma.product.upsert({
        where: {
          name: row.productTitle, // This might not be unique, consider using a compound key
        },
        update: {
          displayName: row.productTitle,
          brand: row.brand || null,
          category: row.category || null,
          gtin: row.gtin || null,
          updatedAt: new Date(),
        },
        create: {
          id: productId,
          name: row.productTitle,
          displayName: row.productTitle,
          brand: row.brand || null,
          category: row.category || null,
          gtin: row.gtin || null,
          imageUrl: row.imageUrl || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create listing
      const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await prisma.listing.create({
        data: {
          id: listingId,
          productId: product.id,
          storeName: storeName,
          url: row.url,
          imageUrl: row.imageUrl || null,
          price: row.price,
          priceCents: Math.round(row.price * 100),
          currency: row.currency,
          deliveryDays: row.deliveryDays || null,
          inStock: row.inStock ?? true,
          source: 'manual',
          merchantOriginalId: merchantId,
          createdAt: new Date(),
          updatedAt: new Date(),
          priceLastSeenAt: new Date(),
        },
      });

      result.listingIds.push(listingId);
      result.rowsSuccess++;
    } catch (error) {
      result.rowsError++;
      result.errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }
  }

  return result;
}

/**
 * Log a merchant feed run
 */
export async function logMerchantFeedRun(
  merchantId: string,
  filename: string,
  result: CsvProcessResult
): Promise<string> {
  const feedRunId = `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await prisma.merchantFeedRun.create({
    data: {
      id: feedRunId,
      merchantId,
      filename,
      status: result.success ? 'completed' : 'completed_with_errors',
      rowsTotal: result.rowsTotal,
      rowsSuccess: result.rowsSuccess,
      rowsError: result.rowsError,
      errorLog: result.errors.length > 0 ? result.errors.join('\n') : null,
      completedAt: new Date(),
    },
  });

  return feedRunId;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
