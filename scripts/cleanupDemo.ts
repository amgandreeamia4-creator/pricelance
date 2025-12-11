#!/usr/bin/env tsx
/**
 * scripts/cleanupDemo.ts
 *
 * CLI script to delete all demo/static products from the database.
 * Run with: npm run dev:cleanup-demo
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables from .env.local and .env
config({ path: ".env.local" });
config({ path: ".env" });

// We create our own PrismaClient here because this runs outside Next.js
const prisma = new PrismaClient();

// Demo detection logic (mirrors src/lib/demoFilter.ts)
const DEMO_ID_PREFIXES = ["dummyjson-", "demo-", "dummy-", "static-"];
const DEMO_BRANDS = ["dummyjson", "demobrand", "demoaudio"];
const DEMO_STORE_NAMES = ["dummyjson"];
const DEMO_URL_PATTERNS = ["dummyjson.com", "example.com"];

function isDemoProductId(productId: string | null | undefined): boolean {
  if (!productId) return false;
  const lower = productId.toLowerCase();
  return DEMO_ID_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function isDemoBrand(brand: string | null | undefined): boolean {
  if (!brand) return false;
  const lower = brand.toLowerCase();
  return DEMO_BRANDS.includes(lower);
}

function isDemoStoreName(storeName: string | null | undefined): boolean {
  if (!storeName) return false;
  const lower = storeName.toLowerCase();
  return DEMO_STORE_NAMES.includes(lower);
}

function isDemoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return DEMO_URL_PATTERNS.some((pattern) => lower.includes(pattern));
}

interface ProductWithListings {
  id: string;
  brand: string | null;
  listings: Array<{ storeName: string; url: string | null }>;
}

function isDemoProduct(product: ProductWithListings): boolean {
  if (isDemoProductId(product.id)) return true;
  if (isDemoBrand(product.brand)) return true;

  for (const listing of product.listings) {
    if (isDemoStoreName(listing.storeName)) return true;
    if (isDemoUrl(listing.url)) return true;
  }

  return false;
}

async function main() {
  console.log("[cleanupDemo] Starting demo product cleanup...");

  try {
    // Find all products with their listings
    const allProducts = await prisma.product.findMany({
      include: {
        listings: {
          select: { id: true, storeName: true, url: true },
        },
      },
    });

    console.log("[cleanupDemo] Total products in database:", allProducts.length);

    // Filter to demo products only
    const demoProducts = allProducts.filter((p) => isDemoProduct(p));
    const productIds = demoProducts.map((p) => p.id);

    console.log("[cleanupDemo] Demo products found:", productIds.length);

    if (productIds.length === 0) {
      console.log("[cleanupDemo] No demo products to delete. Done.");
      return;
    }

    console.log("[cleanupDemo] Deleting demo products:", productIds.slice(0, 5), productIds.length > 5 ? `... and ${productIds.length - 5} more` : "");

    // Delete in correct order to respect foreign key constraints
    // 1. Delete favorites first (no cascade)
    const deletedFavorites = await prisma.favorite.deleteMany({
      where: { productId: { in: productIds } },
    });
    console.log("[cleanupDemo] Deleted favorites:", deletedFavorites.count);

    // 2. Delete price history
    const deletedPriceHistory = await prisma.productPriceHistory.deleteMany({
      where: { productId: { in: productIds } },
    });
    console.log("[cleanupDemo] Deleted price history:", deletedPriceHistory.count);

    // 3. Delete listings
    const deletedListings = await prisma.listing.deleteMany({
      where: { productId: { in: productIds } },
    });
    console.log("[cleanupDemo] Deleted listings:", deletedListings.count);

    // 4. Finally delete products
    const deletedProducts = await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    });
    console.log("[cleanupDemo] Deleted products:", deletedProducts.count);

    console.log("[cleanupDemo] Cleanup complete!");
    console.log("[cleanupDemo] Summary:", {
      deletedProducts: deletedProducts.count,
      deletedListings: deletedListings.count,
      deletedPriceHistory: deletedPriceHistory.count,
      deletedFavorites: deletedFavorites.count,
    });
  } catch (error) {
    console.error("[cleanupDemo] Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
