// src/lib/demoFilter.ts
/**
 * Centralized helper to detect demo/DummyJSON/static products and listings.
 * Used to filter out non-real data from search results, deals, and other user-facing endpoints.
 *
 * Detection rules (any match = demo/static):
 * - Product ID starts with "dummyjson-", "demo-", "dummy-", or "static-"
 * - Product brand is "DummyJSON", "DemoBrand", or "DemoAudio"
 * - Listing storeName is "DummyJSON"
 * - Listing URL contains "dummyjson.com" or "example.com"
 */

/**
 * Known demo/dummy/static product ID prefixes.
 * These products should not appear in user-facing results.
 */
const DEMO_ID_PREFIXES = ["dummyjson-", "demo-", "dummy-", "static-"];

/**
 * Known demo/dummy brand names (case-insensitive comparison).
 */
const DEMO_BRANDS = ["dummyjson", "demobrand", "demoaudio"];

/**
 * Known demo store names (case-insensitive comparison).
 */
const DEMO_STORE_NAMES = ["dummyjson"];

/**
 * Known demo/placeholder URL patterns.
 * Products with listings pointing to these URLs are considered demo/static.
 */
const DEMO_URL_PATTERNS = ["dummyjson.com", "example.com"];

/**
 * Check if a product ID indicates a demo/DummyJSON product.
 */
export function isDemoProductId(productId: string | null | undefined): boolean {
  if (!productId) return false;
  const lower = productId.toLowerCase();
  return DEMO_ID_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * Check if a brand name indicates a demo/DummyJSON product.
 */
export function isDemoBrand(brand: string | null | undefined): boolean {
  if (!brand) return false;
  const lower = brand.toLowerCase();
  return DEMO_BRANDS.includes(lower);
}

/**
 * Check if a store name indicates a demo/DummyJSON listing.
 */
export function isDemoStoreName(storeName: string | null | undefined): boolean {
  if (!storeName) return false;
  const lower = storeName.toLowerCase();
  return DEMO_STORE_NAMES.includes(lower);
}

/**
 * Check if a URL is a demo/placeholder URL.
 */
export function isDemoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return DEMO_URL_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Minimal product shape for demo detection.
 * Supports both `id` and `productId` fields for compatibility with different shapes.
 */
export interface DemoCheckProduct {
  id?: string | null;
  productId?: string | null;
  brand?: string | null;
  listings?: Array<{
    storeName?: string | null;
    url?: string | null;
  }> | null;
}

/**
 * Check if a product is a demo/DummyJSON product.
 * Returns true if ANY of the following are true:
 * - Product ID starts with a demo prefix
 * - Product brand is a known demo brand
 * - ANY listing has a demo store name
 * - ANY listing has a demo URL
 */
export function isDemoProduct(product: DemoCheckProduct | null | undefined): boolean {
  if (!product) return false;

  // Check product ID (support both `id` and `productId` fields)
  const productId = product.id ?? product.productId;
  if (isDemoProductId(productId)) {
    return true;
  }

  // Check brand
  if (isDemoBrand(product.brand)) {
    return true;
  }

  // Check listings
  if (Array.isArray(product.listings)) {
    for (const listing of product.listings) {
      if (isDemoStoreName(listing.storeName)) {
        return true;
      }
      if (isDemoUrl(listing.url)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filter out demo/DummyJSON products from an array.
 * Returns only non-demo products.
 */
export function filterOutDemoProducts<T extends DemoCheckProduct>(products: T[]): T[] {
  // In non-production environments (local dev, preview), keep demo/static
  // products visible so that the app always has data to work with.
  if (process.env.NODE_ENV !== "production") {
    return products;
  }

  // In production, strictly hide demo/static/DummyJSON content from users.
  return products.filter((p) => !isDemoProduct(p));
}

/**
 * Prisma WHERE clause fragment to exclude demo products at the DB level.
 * Use this in Prisma queries to filter out demo products.
 *
 * Note: This only covers ID and brand checks. Listing-level checks
 * must be done in application code after fetching.
 */
export function getDemoExclusionWhereClause(): {
  NOT: {
    OR: Array<Record<string, any>>;
  };
} {
  return {
    NOT: {
      OR: [
        { id: { startsWith: "dummyjson-" } },
        { id: { startsWith: "demo-" } },
        { id: { startsWith: "dummy-" } },
        { id: { startsWith: "static-" } },
        { brand: { in: ["DummyJSON", "DemoBrand", "DemoAudio"] } },
      ],
    },
  };
}
