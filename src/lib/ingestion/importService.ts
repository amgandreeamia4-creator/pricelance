// src/lib/importService.ts
// =============================================================================
// CORE INGESTION SERVICE - Pre-affiliate hardening
// =============================================================================
//
// This is the SINGLE entry point for all product/listing imports into PriceLance.
// All ingestion paths (CSV uploads, URL imports, future affiliate feeds) MUST
// funnel through importNormalizedListings() to ensure consistent data handling.
//
// Architecture for affiliate adapters:
// 1. Create an adapter that implements AffiliateAdapter (see src/lib/affiliates/types.ts)
// 2. The adapter's normalize() method maps provider data → NormalizedListing[]
// 3. Call importNormalizedListings() with the normalized data
// 4. DO NOT bypass this pipeline by calling prisma.product/listing directly
//
// Current adapters using this pipeline:
// - googleSheetAdapter (src/lib/affiliates/googleSheet.ts)
//
// Used by:
// - POST /api/admin/import-csv
// - POST /api/admin/import-from-url
// =============================================================================

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { NormalizedListing } from "@/lib/affiliates/types";
import type { CanonicalListingInput } from "@/lib/canonical";
import {
  defaultCountryForStore,
  normalizeStoreName,
} from "@/lib/stores/registry";
import { inferCategorySlugFromIngestion, inferSubcategoryFromText } from "@/lib/categoryInference";
import { detectBrandFromName } from "@/lib/brandDetector";
import { validateSafeRemoteUrl } from "@/lib/security/safeRemoteUrl";

type ImportErrorType =
  | "VALIDATION_ERROR"
  | "DUPLICATE_SKIPPED"
  | "MISSING_FIELD"
  | "DB_ERROR";

function generateListingKey(row: NormalizedListing) {
  const external = (row as any).merchantOriginalId || (row as any).externalId || "";
  const url = row.url || "";
  const price = typeof row.price === "number" ? String(row.price) : "";
  return `${external}_${url}_${price}`.toLowerCase();
}

function chunkArray<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export type ImportSummary = {
  productsCreated: number;
  productsMatched: number;
  listingsCreated: number;
  listingsUpdated: number;
  errors: { rowNumber: number; message: string }[];
  /** Detailed debug errors with full context (limited to first 10) */
  debugErrors: Array<{
    rowNumber: number;
    rawRow: NormalizedListing;
    transformedData: Record<string, any>;
    errorMessage: string;
    errorStack?: string;
    errorCode?: string | null;
  }>;
  /** Count of rows that upserted a Product but did not create a Listing */
  productOnlyRows: number;
  /** Count of rows that created/updated a Listing */
  listingRows: number;
};

export interface ImportOptions {
  source: "sheet" | "affiliate";
  defaultCountryCode?: string;
  /**
   * Row number offset used for error reporting.
   * For CSV with a header row, this should be 2 so that the first data row is row 2.
   */
  startRowNumber?: number;
  /**
   * If true, each URL is pre-checked with a lightweight HEAD/GET request.
   * Disabled by default for performance.
   */
  validateUrls?: boolean;
  /**
   * Timeout in milliseconds for URL validation requests.
   * Default: 4000ms
   */
  urlTimeoutMs?: number;
  /**
   * Affiliate provider name for attribution (e.g., "fake", "awin", "impact").
   * Only used when source = "affiliate".
   */
  affiliateProvider?: string;
  /**
   * Affiliate program identifier (e.g., "awin_ro_emag").
   * Only used when source = "affiliate".
   */
  affiliateProgram?: string;
  /**
   * Affiliate network identifier (e.g., "PROFITSHARE", "TWOPERFORMANT").
   * NOTE: Currently kept only in options; Listing model does not yet have `network`.
   */
  network?: string;
  /**
   * Merchant ID to associate with the listings.
   */
  merchantId?: string;
  /**
   * Merchant Feed ID to associate with the listings.
   */
  merchantFeedId?: string;
}

function isValidAbsoluteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function isValidStoreId(storeId: string): boolean {
  return /^[a-z0-9_-]+$/i.test(storeId);
}

/**
 * Product matching result from findOrCreateProduct.
 */
type ProductMatchResult = {
  id: string;
  isNew: boolean;
};

// findOrCreateProduct moved inside importNormalizedListings to allow DB client injection

/**
 * Determines if a row is "listing-capable" (has enough data to create a Listing).
 */
function isListingCapable(row: NormalizedListing): boolean {
  const url = row.url?.trim();
  const price = row.price;

  if (!url || !isValidAbsoluteUrl(url)) return false;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0)
    return false;

  return true;
}

async function isUrlReachable(url: string, timeoutMs: number): Promise<boolean> {
  try {
    const safeUrl = await validateSafeRemoteUrl(url, {
      timeoutMs,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let res = await fetch(safeUrl.toString(), {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/csv,text/plain,application/csv,application/vnd.ms-excel,application/octet-stream",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        return false;
      }

      if (!res.ok) {
        res = await fetch(safeUrl.toString(), {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            Accept: "text/csv,text/plain,application/csv,application/vnd.ms-excel,application/octet-stream",
          },
        });
      }

      return res.ok;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}

/**
 * Core import function for all product/listing data.
 */
export async function importNormalizedListings(
  rows: Array<NormalizedListing | CanonicalListingInput>,
  options: ImportOptions,
  dbClient?: typeof prisma,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    productsCreated: 0,
    productsMatched: 0,
    listingsCreated: 0,
    listingsUpdated: 0,
    errors: [],
    debugErrors: [],
    productOnlyRows: 0,
    listingRows: 0,
  };

  const db = dbClient ?? prisma;

  if (!rows.length) return summary;

    const {
    defaultCountryCode,
    startRowNumber = 2,
    validateUrls = false,
    urlTimeoutMs = 4000,
    affiliateProvider,
    affiliateProgram,
    merchantId,
    merchantFeedId,
  } = options;

  // Cache product lookups by GTIN or brand+title (case-insensitive)
  const productCacheByGtin = new Map<string, { id: string }>();
  const productCacheByName = new Map<string, { id: string }>();

  // Helper bound to this import's DB client
  async function findOrCreateProduct(
    productTitle: string,
    brand: string | undefined,
    category: string | undefined,
    subcategory: string | undefined,
    gtin: string | undefined,
  ): Promise<ProductMatchResult> {
    const normalizedGtin = gtin?.trim() || undefined;
    const normalizedBrand = brand?.trim() || undefined;
    const normalizedCategory = category?.trim() || undefined;
    const normalizedSubcategory = subcategory?.trim() || undefined;

    const detectedBrand = detectBrandFromName(productTitle);
    const finalBrand = normalizedBrand || detectedBrand || "Unknown";

    if (normalizedGtin) {
      const gtinMatch = await (db.product.findFirst as any)({
        where: { gtin: { equals: normalizedGtin, mode: 'insensitive' } },
        select: { id: true, brand: true },
      });
      if (gtinMatch) return { id: gtinMatch.id, isNew: false };
    }

    const nameMatch = await db.product.findFirst({
      where: { name: { equals: productTitle, mode: 'insensitive' }, brand: finalBrand ? { equals: finalBrand, mode: 'insensitive' } : null },
      select: { id: true },
    });

    if (nameMatch) {
      await (db.product.update as any)({ where: { id: nameMatch.id }, data: { gtin: normalizedGtin } });
      return { id: nameMatch.id, isNew: false };
    }

    const created = await (db.product.create as any)({ data: { id: randomUUID(), name: productTitle, brand: finalBrand, category: normalizedCategory || null, gtin: normalizedGtin || null } });
    return { id: created.id, isNew: true };
  }

  // === Hardened import: batching, deduplication, retry-safety, per-row error handling ===
  const seen = new Set<string>();
  const importRunId = randomUUID();

  // Optionally record a MerchantFeedRun for observability when merchantId is provided
  if (merchantId) {
    try {
      await db.merchantFeedRun.create({
        data: {
          id: importRunId,
          merchantId,
          filename: null,
          rowsTotal: rows.length,
          rowsImported: 0,
          rowsFailed: 0,
        },
      });
    } catch (err) {
      console.warn("[importService] Could not create MerchantFeedRun", { merchantId, err });
    }
  }

  const batches = chunkArray(rows, 50);
  let absoluteIndex = 0;

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];

    await Promise.all(batch.map(async (incoming) => {
      const rowNumber = startRowNumber + absoluteIndex;
      absoluteIndex++;

      // Normalize incoming shape
      let row: NormalizedListing;
      if ((incoming as any).productName) {
        const c = incoming as CanonicalListingInput;
        const storeId = (c.listing.storeName || "unknown")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, "_");
        row = {
          productTitle: c.productName,
          brand: c.brand ?? undefined,
          category: c.category ?? undefined,
          gtin: c.externalId ?? undefined,
          storeId,
          storeName: c.listing.storeName,
          url: c.listing.url,
          price: c.listing.price,
          currency: c.listing.currency,
          imageUrl: c.imageUrl ?? undefined,
          deliveryDays: undefined,
          fastDelivery: undefined,
          inStock: c.listing.inStock ?? undefined,
          countryCode: undefined,
          source: 'affiliate',
          merchantId: undefined,
          merchantFeedId: undefined,
        } as NormalizedListing;
      } else {
        row = incoming as NormalizedListing;
      }

      try {
        // Dedupe within the same import run
        const key = generateListingKey(row);
        if (seen.has(key)) {
          summary.errors.push({ rowNumber, message: 'Duplicate in file - skipped' });
          if (summary.debugErrors.length < 10) {
            summary.debugErrors.push({ rowNumber, rawRow: row, transformedData: { key }, errorMessage: 'Duplicate in file - skipped' } as any);
          }
          return;
        }
        seen.add(key);

        // === STEP 1: Validate product fields and infer category ===
        const productTitle = row.productTitle?.trim();
        const brand = row.brand?.trim();
        const rawCategory = row.category?.trim();
        const gtin = row.gtin?.trim();

        const inferredCategory = inferCategorySlugFromIngestion({
          title: productTitle,
          description: null,
          campaignName: row.storeName,
          explicitCategorySlug: rawCategory,
        });

        const subcategory = inferredCategory
          ? inferSubcategoryFromText(inferredCategory as any, productTitle, null)
          : null;

        const category = inferredCategory || rawCategory;
        if (!productTitle) {
          summary.errors.push({ rowNumber, message: 'Missing product_title' });
          return;
        }

        if (!brand && !category) {
          summary.errors.push({ rowNumber, message: 'Missing brand and category (at least one required)' });
          return;
        }

        // === STEP 2: Find or Create Product (cached) ===
        const gtinCacheKey = gtin?.toLowerCase();
        const nameCacheKey = `${(brand || '').toLowerCase()}|${productTitle.toLowerCase()}`;

        let productInfo = gtinCacheKey ? productCacheByGtin.get(gtinCacheKey) : undefined;
        if (!productInfo) productInfo = productCacheByName.get(nameCacheKey);
        if (!productInfo) {
          const result = await findOrCreateProduct(productTitle, brand, category, subcategory || undefined, gtin);
          productInfo = { id: result.id };
          if (result.isNew) summary.productsCreated++; else summary.productsMatched++;
          if (gtinCacheKey) productCacheByGtin.set(gtinCacheKey, productInfo);
          productCacheByName.set(nameCacheKey, productInfo);
        }

        const productId = productInfo.id;

        // === STEP 3: Listing capability and listing validation ===
        const listingCapable = isListingCapable(row);
        if (!listingCapable) { summary.productOnlyRows++; return; }

        const storeIdRaw = row.storeId?.trim() ?? '';
        const storeNameRaw = row.storeName?.trim() ?? '';
        const url = row.url!.trim();
        const currency = row.currency?.trim().toUpperCase();
        const price = row.price!;
        const imageUrl = row.imageUrl?.trim() || null;

        if (imageUrl) {
          try {
            const currentProduct = await (db.product.findUnique as any)({ where: { id: productId }, select: { imageUrl: true } });
            if (currentProduct && !currentProduct.imageUrl) {
              await (db.product.update as any)({ where: { id: productId }, data: { imageUrl } });
            }
          } catch (e) {
            // non-fatal
          }
        }

        if (!storeIdRaw || !isValidStoreId(storeIdRaw)) {
          summary.errors.push({ rowNumber, message: 'Listing row missing valid storeId' });
          return;
        }
        if (!storeNameRaw) { summary.errors.push({ rowNumber, message: 'Listing row missing storeName' }); return; }
        if (!currency || currency.length < 3 || currency.length > 10) { summary.errors.push({ rowNumber, message: 'Listing row has invalid currency' }); return; }

        const storeName = normalizeStoreName(storeIdRaw, storeNameRaw);
        if (validateUrls) {
          const reachable = await isUrlReachable(url, urlTimeoutMs);
          if (!reachable) { summary.errors.push({ rowNumber, message: 'URL validation failed (endpoint not reachable)' }); return; }
        }

        // === STEP 4: Safe upsert (findFirst -> update or create) ===
        const countryFromRegistry = defaultCountryForStore(storeIdRaw, defaultCountryCode);
        const countryCode = row.countryCode?.trim().toUpperCase() || countryFromRegistry || defaultCountryCode?.trim().toUpperCase() || undefined;
        const inStock = typeof row.inStock === 'boolean' ? row.inStock : true;
        const deliveryDays = typeof row.deliveryDays === 'number' && Number.isFinite(row.deliveryDays) ? row.deliveryDays : null;
        const fastDelivery = typeof row.fastDelivery === 'boolean' ? row.fastDelivery : null;
        const safePriceCents = Math.min(Math.round(price * 100), 2147483647);

          try {
            const existingListing = await (db.listing.findFirst as any)({
            where: {
              productId,
              storeName: { equals: storeName, mode: 'insensitive' },
              url,
            },
            select: { id: true, price: true, currency: true, storeName: true, imageUrl: true },
          });

          const now = new Date();

            if (existingListing) {
            const previousPrice = typeof existingListing.price === 'number' ? existingListing.price : 0;
            const priceChanged = previousPrice !== price;
            await (db.listing.update as any)({
              where: { id: existingListing.id },
              data: {
                price,
                priceCents: safePriceCents,
                currency,
                deliveryTimeDays: deliveryDays,
                estimatedDeliveryDays: deliveryDays,
                deliveryDays,
                fastDelivery,
                isFastDelivery: fastDelivery,
                inStock,
                countryCode: countryCode ?? null,
                source: options.source,
                priceLastSeenAt: now,
                imageUrl,
                ...(affiliateProvider && { affiliateProvider }),
                ...(affiliateProgram && { affiliateProgram }),
                ...(merchantId && { merchantId }),
                ...(merchantFeedId && { merchantFeedId }),
              },
            });
            summary.listingsUpdated++;
            summary.listingRows++;

            if (priceChanged) {
              await db.productPriceHistory.create({ data: { id: randomUUID(), productId, date: new Date(), price, currency, storeName } });
            }
          } else {
            await (db.listing.create as any)({
              data: {
                productId,
                storeName,
                url,
                price,
                priceCents: safePriceCents,
                currency,
                deliveryTimeDays: deliveryDays,
                estimatedDeliveryDays: deliveryDays,
                deliveryDays,
                fastDelivery,
                isFastDelivery: fastDelivery,
                inStock,
                countryCode: countryCode ?? null,
                source: options.source,
                priceLastSeenAt: now,
                imageUrl,
                ...(affiliateProvider && { affiliateProvider }),
                ...(affiliateProgram && { affiliateProgram }),
                ...(merchantId && { merchantId }),
                ...(merchantFeedId && { merchantFeedId }),
              },
            });
            summary.listingsCreated++;
            summary.listingRows++;
          }

          // update MerchantFeedRun counters if present
          if (merchantId) {
            try {
              await db.merchantFeedRun.update({ where: { id: importRunId }, data: { rowsImported: { increment: 1 } as any } as any } as any);
            } catch (_e) {
              // ignore update errors
            }
          }
        } catch (err: any) {
          const msg = err instanceof Error ? err.message : String(err);
          summary.errors.push({ rowNumber, message: `DB error: ${msg}` });
          if (summary.debugErrors.length < 10) {
            summary.debugErrors.push({ rowNumber, rawRow: row, transformedData: { url: row.url, price: row.price }, errorMessage: msg } as any);
          }
          if (merchantId) {
            try { await db.merchantFeedRun.update({ where: { id: importRunId }, data: { rowsFailed: { increment: 1 } as any } as any } as any); } catch {}
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during import';
        const errorStack = error instanceof Error && error.stack ? error.stack : undefined;
        const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : null;

        console.error(`[importService] Row ${rowNumber} failed`, { rawRow: { title: row.productTitle, brand: row.brand, category: row.category, storeName: row.storeName, url: row.url, price: row.price, currency: row.currency }, errorMessage, errorCode }, errorStack);

        summary.errors.push({ rowNumber, message: errorMessage });
        if (summary.debugErrors.length < 10) {
          const transformedData: Record<string, any> = { productTitle: row.productTitle?.trim(), brand: row.brand?.trim(), category: row.category?.trim(), storeName: row.storeName?.trim(), url: row.url?.trim(), price: row.price, currency: row.currency?.trim().toUpperCase(), storeId: row.storeId?.trim(), inStock: row.inStock };
          summary.debugErrors.push({ rowNumber, rawRow: row, transformedData, errorMessage, errorStack, errorCode } as any);
        }
      }
    }));
  }

  return summary;
}