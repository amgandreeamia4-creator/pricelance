// src/lib/productAggregator.ts
// Aggregates products from database and providers with safe fallbacks

import { prisma } from "@/lib/db";
import { getEnabledProviders } from "@/lib/providers";
import { importNormalizedListings } from "@/lib/importService";
import type { NormalizedListing } from "@/lib/affiliates/types";
import type { ProductProvider } from "@/lib/providers/types";
import { CATEGORY_SYNONYMS, type CategoryKey } from "@/config/categoryFilters";
import { isListingFromDisabledNetwork } from "@/config/affiliateNetworks";

export interface ProductAggregatorOptions {
  query?: string;
  category?: CategoryKey;
  subcategory?: string;
  store?: string;
  location?: string;
  page?: number;
  perPage?: number;
  sort?: "relevance" | "price-asc" | "price-desc";
  useProvidersAsBackup?: boolean; // If true, only use providers if DB has no results
}

export interface AggregatedProductResponse {
  id: string;
  name: string;
  displayName: string | null;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
  listings: {
    id: string;
    storeId: string | null;
    storeName: string | null;
    price: number | null;
    currency: string | null;
    url: string | null;
    affiliateProvider: string | null;
    source: string | null;
    fastDelivery: boolean | null;
    imageUrl: string | null;
  }[];
}

export interface ProductAggregatorResult {
  products: AggregatedProductResponse[];
  total: number;
  page: number;
  perPage: number;
  sources: string[]; // Which sources were used: ["database"] or ["providers"] or ["database", "providers"]
}

/**
 * Get products from database with the same logic as the existing API
 */
async function getProductsFromDatabase(
  options: ProductAggregatorOptions,
): Promise<{ products: AggregatedProductResponse[]; total: number }> {
  const {
    query = "",
    category: categoryKeyParam,
    subcategory,
    store,
    location,
    page = 1,
    perPage = 24,
    sort = "relevance",
  } = options;

  const skip = (page - 1) * perPage;

  // Build Prisma where object with category synonyms
  const where: any = { AND: [] as any[] };

  if (query) {
    where.AND.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (categoryKeyParam && CATEGORY_SYNONYMS[categoryKeyParam]) {
    const synonyms = CATEGORY_SYNONYMS[categoryKeyParam];

    where.AND.push({
      OR: synonyms.flatMap((term) => [
        { category: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
        { displayName: { contains: term, mode: "insensitive" } },
      ]),
    });
  }

  if (subcategory) {
    where.subcategory = subcategory;
  }

  const effectiveWhere = where.AND.length ? where : undefined;

  try {
    const dbProducts = (await prisma.product.findMany({
      where: effectiveWhere,
      skip,
      take: perPage,
    })) as any[];

    if (dbProducts.length === 0) {
      return { products: [], total: 0 };
    }

    // Fetch listings separately
    const productIds = dbProducts.map((p) => p.id);
    const listingsWhere: any = {
      productId: { in: productIds },
      inStock: true,
    };

    if (store) {
      listingsWhere.storeId = store;
    }

    if (location) {
      listingsWhere.OR = [
        { countryCode: { equals: location, mode: "insensitive" } },
        { countryCode: null },
        { countryCode: { not: location } },
      ];
    }

    const dbListings = await prisma.listing.findMany({
      where: listingsWhere,
    });

    // Group listings by productId
    const listingsByProductId = new Map<string, any[]>();
    for (const l of dbListings) {
      const pid = l.productId as string;
      const existing = listingsByProductId.get(pid);
      if (existing) {
        existing.push(l);
      } else {
        listingsByProductId.set(pid, [l]);
      }
    }

    // Filter out disabled affiliate networks
    const filterListingsForVisibility = (listings: any[]) => {
      return listings.filter(
        (l) =>
          !isListingFromDisabledNetwork({
            affiliateProvider: l.affiliateProvider,
            affiliateProgram: l.affiliateProgram,
            url: l.url,
          }),
      );
    };

    // Map to response format
    const products: AggregatedProductResponse[] = dbProducts
      .map((p: any) => {
        const rawListings = listingsByProductId.get(p.id) ?? [];
        const visibleListings = filterListingsForVisibility(rawListings);

        return {
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          brand: p.brand,
          imageUrl: p.imageUrl,
          category: p.category ?? null,
          listings: visibleListings.map((l: any) => ({
            id: l.id,
            storeId: l.storeId ?? null,
            storeName: l.storeName ?? null,
            price: l.price,
            currency: l.currency ?? null,
            url: l.url ?? l.productUrl ?? l.affiliateUrl ?? null,
            affiliateProvider: l.affiliateProvider ?? null,
            source: l.source ?? null,
            fastDelivery: l.fastDelivery ?? null,
            imageUrl: l.imageUrl ?? null,
          })),
        };
      })
      .filter((p: any) => p.listings.length > 0); // Only keep products with visible listings

    // Apply sorting
    if (sort === "price-asc") {
      products.sort((a, b) => getBestPrice(a) - getBestPrice(b));
    } else if (sort === "price-desc") {
      products.sort((a, b) => getBestPrice(b) - getBestPrice(a));
    }

    return { products, total: products.length };
  } catch (error) {
    console.error("[productAggregator] Database error:", error);
    return { products: [], total: 0 };
  }
}

/**
 * Get products from enabled providers
 */
async function getProductsFromProviders(
  options: ProductAggregatorOptions,
): Promise<{ products: AggregatedProductResponse[]; total: number }> {
  const { query = "", perPage = 24 } = options;

  try {
    const providers = getEnabledProviders();
    console.info(
      "[productAggregator] Using providers:",
      providers.map((p) => p.name),
    );

    if (providers.length === 0) {
      console.warn("[productAggregator] No providers available");
      return { products: [], total: 0 };
    }

    // Get products from all providers
    const allPayloads: any[] = [];
    for (const provider of providers) {
      try {
        const payloads = await provider.searchProducts(query);
        allPayloads.push(...payloads);
      } catch (providerError) {
        console.error(
          `[productAggregator] Provider ${provider.name} failed:`,
          providerError,
        );
        // Continue with other providers
      }
    }

    if (allPayloads.length === 0) {
      return { products: [], total: 0 };
    }

    // Convert provider data to normalized listings format
    const normalizedListings: NormalizedListing[] = [];
    for (const payload of allPayloads) {
      for (const item of payload) {
        if (item.listings && Array.isArray(item.listings)) {
          for (const listing of item.listings) {
            normalizedListings.push({
              productTitle: item.name || "Unknown Product",
              brand: item.brand || "",
              category: item.category || "",
              gtin: item.gtin || undefined,
              storeId: listing.storeName || "unknown",
              storeName: listing.storeName || "Unknown Store",
              url: listing.url || "",
              price: listing.price || 0,
              currency: listing.currency || "USD",
              deliveryDays: listing.deliveryDays || undefined,
              fastDelivery: listing.fastDelivery || undefined,
              inStock: listing.inStock ?? true,
              imageUrl: listing.imageUrl || item.imageUrl || undefined,
              source: "affiliate",
            });
          }
        }
      }
    }

    // Try to ingest the normalized listings (this creates products/listings in DB)
    if (normalizedListings.length > 0) {
      try {
        await importNormalizedListings(normalizedListings, {
          source: "affiliate",
        });
      } catch (ingestError) {
        console.error("[productAggregator] Import failed:", ingestError);
        // Continue anyway - we'll try to return the raw data
      }
    }

    // Convert provider data to our response format
    const products: AggregatedProductResponse[] = [];
    let totalProducts = 0;

    for (const payload of allPayloads) {
      for (const item of (payload as any[]).slice(
        0,
        perPage - products.length,
      )) {
        if (products.length >= perPage) break;

        const product: AggregatedProductResponse = {
          id:
            item.id ||
            `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: item.name || "Unknown Product",
          displayName: item.displayName || null,
          brand: item.brand || null,
          imageUrl: item.imageUrl || null,
          category: item.category || null,
          listings: (item.listings || []).map((listing: any) => ({
            id:
              listing.id ||
              `temp_listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            storeId: listing.storeId || null,
            storeName: listing.storeName || "Unknown Store",
            price: listing.price || null,
            currency: listing.currency || "USD",
            url: listing.url || null,
            affiliateProvider: listing.affiliateProvider || null,
            source: listing.source || "provider",
            fastDelivery: listing.fastDelivery || null,
            imageUrl: listing.imageUrl || null,
          })),
        };

        products.push(product);
        totalProducts++;
      }

      if (products.length >= perPage) break;
    }

    return { products, total: totalProducts };
  } catch (error) {
    console.error("[productAggregator] Provider error:", error);
    return { products: [], total: 0 };
  }
}

/**
 * Helper function to get the best price for sorting
 */
function getBestPrice(product: AggregatedProductResponse): number {
  if (!product.listings || product.listings.length === 0) return Infinity;
  const prices = product.listings.map((l) =>
    typeof l.price === "number" ? l.price : Infinity,
  );
  return Math.min(...prices);
}

/**
 * Main aggregation function that combines database and provider results
 */
export async function aggregateProducts(
  options: ProductAggregatorOptions = {},
): Promise<ProductAggregatorResult> {
  const { useProvidersAsBackup = true } = options;
  const sources: string[] = [];

  // First, try to get products from database
  const dbResult = await getProductsFromDatabase(options);

  // If database has results, use them
  if (dbResult.products.length > 0) {
    sources.push("database");
    console.info("[productAggregator] Using database results:", {
      count: dbResult.products.length,
    });

    return {
      products: dbResult.products,
      total: dbResult.total,
      page: options.page || 1,
      perPage: options.perPage || 24,
      sources,
    };
  }

  // If database is empty and we should use providers as backup
  if (useProvidersAsBackup) {
    console.info(
      "[productAggregator] Database empty, falling back to providers",
    );
    const providerResult = await getProductsFromProviders(options);

    if (providerResult.products.length > 0) {
      sources.push("providers");
      console.info("[productAggregator] Using provider results:", {
        count: providerResult.products.length,
      });

      return {
        products: providerResult.products,
        total: providerResult.total,
        page: options.page || 1,
        perPage: options.perPage || 24,
        sources,
      };
    }
  }

  // No results from either source
  console.warn("[productAggregator] No products found from any source");
  return {
    products: [],
    total: 0,
    page: options.page || 1,
    perPage: options.perPage || 24,
    sources,
  };
}
