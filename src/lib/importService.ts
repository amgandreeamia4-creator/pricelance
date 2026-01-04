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
import {
  defaultCountryForStore,
  normalizeStoreName,
} from "@/lib/stores/registry";

export type ImportSummary = {
  productsCreated: number;
  productsMatched: number;
  listingsCreated: number;
  listingsUpdated: number;
  errors: { rowNumber: number; message: string }[];
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

/**
 * Finds or creates a Product using GTIN-first, then name+brand matching strategy.
 */
async function findOrCreateProduct(
  productTitle: string,
  brand: string | undefined,
  category: string | undefined,
  gtin: string | undefined,
): Promise<ProductMatchResult> {
  const normalizedGtin = gtin?.trim() || undefined;
  const normalizedBrand = brand?.trim() || undefined;
  const normalizedCategory = category?.trim() || undefined;

  // Strategy 1: Try GTIN-first matching if GTIN is provided
  if (normalizedGtin) {
    const gtinMatch = await (prisma.product.findFirst as any)({
      where: {
        gtin: { equals: normalizedGtin, mode: "insensitive" },
      },
      select: { id: true, brand: true },
    });

    if (gtinMatch) {
      return { id: gtinMatch.id, isNew: false };
    }
  }

  // Strategy 2: Fall back to name + brand matching
  const nameMatch = await prisma.product.findFirst({
    where: {
      name: { equals: productTitle, mode: "insensitive" },
      brand: normalizedBrand
        ? { equals: normalizedBrand, mode: "insensitive" }
        : null,
    },
    select: { id: true },
  });

  if (nameMatch) {
    await (prisma.product.update as any)({
      where: { id: nameMatch.id },
      data: { gtin: normalizedGtin },
    });

    return { id: nameMatch.id, isNew: false };
  }

  // Strategy 3: Create new product
  const created = await (prisma.product.create as any)({
    data: {
      id: randomUUID(),
      name: productTitle,
      brand: normalizedBrand || null,
      category: normalizedCategory || null,
      gtin: normalizedGtin || null,
    },
  });

  return { id: created.id, isNew: true };
}

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });

      if (!res.ok) {
        res = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
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
  rows: NormalizedListing[],
  options: ImportOptions,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    productsCreated: 0,
    productsMatched: 0,
    listingsCreated: 0,
    listingsUpdated: 0,
    errors: [],
    productOnlyRows: 0,
    listingRows: 0,
  };

  if (!rows.length) return summary;

  const {
    defaultCountryCode,
    startRowNumber = 2,
    validateUrls = false,
    urlTimeoutMs = 4000,
    affiliateProvider,
    affiliateProgram,
  } = options;

  // Cache product lookups by GTIN or brand+title (case-insensitive)
  const productCacheByGtin = new Map<string, { id: string }>();
  const productCacheByName = new Map<string, { id: string }>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = startRowNumber + i;

    try {
      // === STEP 1: Validate product fields ===
      const productTitle = row.productTitle?.trim();
      const brand = row.brand?.trim();
      const category = row.category?.trim();
      const gtin = row.gtin?.trim();

      // A row must have at least product_title to be valid
      if (!productTitle) {
        summary.errors.push({
          rowNumber,
          message: "Missing product_title",
        });
        continue;
      }

      // A row needs at least brand or category as product identity
      if (!brand && !category) {
        summary.errors.push({
          rowNumber,
          message: "Missing brand and category (at least one required)",
        });
        continue;
      }

      // === STEP 2: Find or Create Product ===
      const gtinCacheKey = gtin?.toLowerCase();
      const nameCacheKey = `${(brand || "").toLowerCase()}|${productTitle.toLowerCase()}`;

      let productInfo = gtinCacheKey
        ? productCacheByGtin.get(gtinCacheKey)
        : undefined;

      if (!productInfo) {
        productInfo = productCacheByName.get(nameCacheKey);
      }

      if (!productInfo) {
        const result = await findOrCreateProduct(
          productTitle,
          brand,
          category,
          gtin,
        );
        productInfo = { id: result.id };

        if (result.isNew) {
          summary.productsCreated++;
        } else {
          summary.productsMatched++;
        }

        if (gtinCacheKey) {
          productCacheByGtin.set(gtinCacheKey, productInfo);
        }
        productCacheByName.set(nameCacheKey, productInfo);
      }

      const productId = productInfo.id;

      // === STEP 3: Check if row is listing-capable ===
      const listingCapable = isListingCapable(row);

      if (!listingCapable) {
        summary.productOnlyRows++;
        continue;
      }

      // === STEP 4: Validate listing fields for listing-capable rows ===
      const storeIdRaw = row.storeId?.trim() ?? "";
      const storeNameRaw = row.storeName?.trim() ?? "";
      const url = row.url!.trim();
      const currency = row.currency?.trim().toUpperCase();
      const price = row.price!;
      const imageUrl = row.imageUrl?.trim() || null;

      // === STEP 4.5: Update Product imageUrl if empty and listing provides one ===
      if (imageUrl) {
        const currentProduct = await (prisma.product.findUnique as any)({
          where: { id: productId },
          select: { imageUrl: true },
        });
        
        if (currentProduct && !currentProduct.imageUrl) {
          await (prisma.product.update as any)({
            where: { id: productId },
            data: { imageUrl },
          });
        }
      }

      if (!storeIdRaw || !isValidStoreId(storeIdRaw)) {
        summary.errors.push({
          rowNumber,
          message:
            "Listing row missing valid storeId (must be non-empty and use letters, numbers, dash or underscore)",
        });
        continue;
      }

      if (!storeNameRaw) {
        summary.errors.push({
          rowNumber,
          message: "Listing row missing storeName",
        });
        continue;
      }

      if (!currency || currency.length < 3 || currency.length > 10) {
        summary.errors.push({
          rowNumber,
          message:
            "Listing row has invalid currency (must be 3-10 characters)",
        });
        continue;
      }

      const storeName = normalizeStoreName(storeIdRaw, storeNameRaw);

      if (validateUrls) {
        const reachable = await isUrlReachable(url, urlTimeoutMs);
        if (!reachable) {
          summary.errors.push({
            rowNumber,
            message: "URL validation failed (endpoint not reachable)",
          });
          continue;
        }
      }

      // === STEP 5: Create or update Listing ===
      const countryFromRegistry = defaultCountryForStore(
        storeIdRaw,
        defaultCountryCode,
      );
      const countryCode =
        row.countryCode?.trim().toUpperCase() ||
        countryFromRegistry ||
        defaultCountryCode?.trim().toUpperCase() ||
        undefined;

      const inStock =
        typeof row.inStock === "boolean" ? row.inStock : true;

      const deliveryDays =
        typeof row.deliveryDays === "number" &&
        Number.isFinite(row.deliveryDays)
          ? row.deliveryDays
          : null;

      const fastDelivery =
        typeof row.fastDelivery === "boolean" ? row.fastDelivery : null;

      const safePriceCents = Math.min(
        Math.round(price * 100),
        2147483647,
      );

      const existingListing = await (prisma.listing.findFirst as any)({
        where: {
          productId,
          storeName: { equals: storeName, mode: "insensitive" },
          url,
        },
        select: {
          id: true,
          price: true,
          currency: true,
          storeName: true,
          imageUrl: true,
        },
      });

      const now = new Date();

      if (existingListing) {
        const previousPrice =
          typeof existingListing.price === "number"
            ? existingListing.price
            : 0;
        const priceChanged = previousPrice !== price;

        await (prisma.listing.update as any)({
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
            imageUrl, // Update imageUrl if provided
            ...(affiliateProvider && { affiliateProvider }),
            ...(affiliateProgram && { affiliateProgram }),
          },
        });
        summary.listingsUpdated++;
        summary.listingRows++;

        if (priceChanged) {
          await prisma.productPriceHistory.create({
            data: {
              productId,
              date: new Date(),
              price,
              currency,
              storeName,
            },
          });
        }
      } else {
        await (prisma.listing.create as any)({
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
            imageUrl, // Include imageUrl in new listings
            ...(affiliateProvider && { affiliateProvider }),
            ...(affiliateProgram && { affiliateProgram }),
          },
        });
        summary.listingsCreated++;
        summary.listingRows++;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error during import";
      summary.errors.push({ rowNumber, message });
    }
  }

  return summary;
}