#!/usr/bin/env tsx
/**
 * scripts/runRealstore.ts
 *
 * CLI script to fetch products from the realstore provider and ingest them.
 * Run with: npm run dev:run-realstore
 *
 * Optional args:
 *   --query="smartphone"  (default: "laptop")
 *
 * This module also exports `runRealstoreIngest(query)` for use by other scripts.
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables from .env.local and .env
config({ path: ".env.local" });
config({ path: ".env" });

// Shared PrismaClient instance for this script module
let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Disconnect Prisma client. Call this when done with all ingestion.
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// Provider config (mirrors src/config/providerConfig.ts)
function getRealStoreConfig() {
  const enabled = process.env.PROVIDER_REALSTORE_ENABLED?.toLowerCase() === "true";
  return {
    id: "realstore",
    name: "Real-Time Product Search (Aggregator)",
    enabled,
    baseUrl: process.env.REALTIME_PRODUCT_SEARCH_BASE_URL || "https://real-time-product-search.p.rapidapi.com",
    apiKeyEnvVar: "REALTIME_PRODUCT_SEARCH_API_KEY",
    timeoutMs: 20000,
  };
}

// Types for API response
interface RTPProductOffer {
  store_name?: string;
  store_rating?: number | null;
  offer_page_url?: string;
  price?: string;
  shipping?: string;
}

interface RTPProduct {
  product_title?: string;
  product_photos?: string[];
  product_rating?: number;
  product_page_url?: string;
  product_offers_page_url?: string;
  product_num_reviews?: number;
  typical_price_range?: string[];
  offer?: RTPProductOffer;
  offers?: RTPProductOffer[];
  offer_list?: RTPProductOffer[];
}

// Helpers
function extractNumeric(value?: string | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferCurrencySymbol(price?: string | null): string {
  if (!price) return "USD";
  if (price.includes("€")) return "EUR";
  if (price.includes("£")) return "GBP";
  return "USD";
}

async function fetchFromRealStore(query: string) {
  const cfg = getRealStoreConfig();

  if (!cfg.enabled) {
    console.log("[runRealstore] Provider is disabled. Set PROVIDER_REALSTORE_ENABLED=true");
    return [];
  }

  const baseUrl = cfg.baseUrl.replace(/\/$/, "");
  const apiKey = process.env[cfg.apiKeyEnvVar];

  if (!apiKey) {
    console.error("[runRealstore] Missing API key:", cfg.apiKeyEnvVar);
    return [];
  }

  const url = `${baseUrl}/search-v2?q=${encodeURIComponent(query)}&country=us&language=en&page=1&limit=10&sort_by=BEST_MATCH&product_condition=ANY`;

  console.log("[runRealstore] Fetching:", url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "real-time-product-search.p.rapidapi.com",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[runRealstore] HTTP error:", res.status, text.slice(0, 200));
      return [];
    }

    const json = await res.json();
    const dataField = json?.data;
    const candidates =
      (Array.isArray(dataField) ? undefined : dataField?.products) ??
      dataField ??
      json?.products ??
      json?.items ??
      [];

    return Array.isArray(candidates) ? candidates : [];
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      console.error("[runRealstore] Timeout after", cfg.timeoutMs, "ms");
    } else {
      console.error("[runRealstore] Fetch error:", err);
    }
    return [];
  }
}

async function ingestProducts(items: RTPProduct[], query: string) {
  const db = getPrisma();
  let count = 0;
  let listingsCount = 0;
  const productIds: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.product_title ?? query;
    const imageUrl = item.product_photos?.[0] ?? null;
    const productId = `rtp-${query}-${i}`;

    // Build listings from offers
    const rawOffers: RTPProductOffer[] =
      item.offers ?? item.offer_list ?? (item.offer ? [item.offer] : []);

    const listings: Array<{
      storeName: string;
      url: string | null;
      price: number;
      currency: string;
      shippingCost: number | null;
      imageUrl: string | null;
      countryCode?: string | null;
    }> = [];

    for (const offer of rawOffers) {
      const priceNum = extractNumeric(offer.price);
      const offerUrl =
        offer.offer_page_url ?? item.product_offers_page_url ?? item.product_page_url ?? null;

      if (priceNum && priceNum > 0 && offerUrl) {
        listings.push({
          storeName: offer.store_name ?? "Unknown store",
          url: offerUrl,
          price: priceNum,
          currency: inferCurrencySymbol(offer.price),
          shippingCost: extractNumeric(offer.shipping),
          imageUrl,
        });
      }

      if (listings.length >= 5) break;
    }

    // Fallback if no listings
    if (listings.length === 0 && item.offer) {
      const offer = item.offer;
      const priceNum = extractNumeric(offer.price) ?? 0;
      const offerUrl =
        offer.offer_page_url ?? item.product_offers_page_url ?? item.product_page_url ?? null;

      listings.push({
        storeName: offer.store_name ?? "Online store",
        url: offerUrl,
        price: priceNum,
        currency: inferCurrencySymbol(offer.price),
        shippingCost: extractNumeric(offer.shipping),
        imageUrl,
        countryCode: "US",
      });
    }

    if (listings.length === 0) {
      console.log("[runRealstore] Skipping product with no valid listings:", title.slice(0, 50));
      continue;
    }

    try {
      // Upsert product
      // Store the search query in category and description so DB text search can find products by query
      const product = await db.product.upsert({
        where: { id: productId },
        update: {
          name: title,
          displayName: title,
          description: `Search: ${query}`,
          category: query,
          imageUrl,
          thumbnailUrl: imageUrl,
          updatedAt: new Date(),
        },
        create: {
          id: productId,
          name: title,
          displayName: title,
          description: `Search: ${query}`,
          category: query,
          imageUrl,
          thumbnailUrl: imageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Replace listings
      await db.listing.deleteMany({ where: { productId: product.id } });

      for (const l of listings) {
        await db.listing.create({
          data: {
            id: `${product.id}-${l.storeName.toLowerCase().replace(/\s+/g, '-')}`,
            productId: product.id,
            storeName: l.storeName,
            url: l.url,
            imageUrl: l.imageUrl,
            price: l.price,
            priceCents: Math.round(l.price * 100),
            currency: l.currency,
            shippingCost: l.shippingCost,
            countryCode: "US", // Realstore queries are currently US-focused
            inStock: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        listingsCount++;
      }

      count++;
      productIds.push(product.id);
    } catch (error) {
      console.error("[runRealstore] Failed to ingest product:", productId, error);
    }
  }

  return { count, listingsCount, productIds };
}

/**
 * Result of a single realstore ingestion run.
 */
export interface RealstoreIngestResult {
  query: string;
  fetchedItems: number;
  ingestedProducts: number;
  ingestedListings: number;
  productIds: string[];
}

/**
 * Reusable function to run realstore ingestion for a given query.
 * Does NOT call process.exit, so it can be used from other scripts.
 * Does NOT disconnect Prisma - caller should call disconnectPrisma() when done.
 *
 * @param query - The search query to use
 * @returns Result object with counts and product IDs
 */
export async function runRealstoreIngest(query: string): Promise<RealstoreIngestResult> {
  console.log("[runRealstore] Starting with query:", query);

  const items = await fetchFromRealStore(query);
  console.log("[runRealstore] Fetched items:", items.length);

  if (items.length === 0) {
    console.log("[runRealstore] No items to ingest for query:", query);
    return {
      query,
      fetchedItems: 0,
      ingestedProducts: 0,
      ingestedListings: 0,
      productIds: [],
    };
  }

  const result = await ingestProducts(items, query);

  console.log("[runRealstore] Ingestion complete for query:", query);
  console.log("[runRealstore] Summary:", {
    ingestedProducts: result.count,
    ingestedListings: result.listingsCount,
    productIds: result.productIds.slice(0, 5),
  });

  return {
    query,
    fetchedItems: items.length,
    ingestedProducts: result.count,
    ingestedListings: result.listingsCount,
    productIds: result.productIds,
  };
}

/**
 * CLI entry point - only runs when this file is executed directly.
 */
async function main() {
  // Parse --query arg
  const args = process.argv.slice(2);
  let query = "laptop";

  for (const arg of args) {
    if (arg.startsWith("--query=")) {
      query = arg.slice("--query=".length);
    }
  }

  try {
    await runRealstoreIngest(query);
  } catch (error) {
    console.error("[runRealstore] Error:", error);
    process.exit(1);
  } finally {
    await disconnectPrisma();
  }
}

// Only run main() if this file is executed directly (not imported)
const isDirectRun = require.main === module;
if (isDirectRun) {
  main();
}
