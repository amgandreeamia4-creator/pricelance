// src/lib/productRepository.ts
import type { ProductWithHistory } from "@/types/product";
import { prisma } from "./db";
import { filterOutDemoProducts } from "./demoFilter";

export type ProductSortBy = "default" | "price" | "delivery";

export function normalizeSearchQuery(input: string): string {
  const normalized = input.trim().toLowerCase();

  if (!normalized) return "";

  // Phone-related aliases → canonical "smartphone" term
  if (
    normalized === "phone" ||
    normalized === "phones" ||
    normalized === "smartphone" ||
    normalized === "smartphones"
  ) {
    return "smartphone";
  }

  // Additional alias groups can be added here (perfume/fragrance, skincare, groceries, etc.)

  return normalized;
}

export interface ProductSearchOptions {
  location?: string;
  sortBy?: ProductSortBy;
  store?: string;
  fastOnly?: boolean;
  /**
   * Optional canonical category resolved from query/alias (e.g. "fragrances" for "perfume").
   * Used to bias/filter results by category.
   */
  categoryHint?: string | null;
  /**
   * Additional text terms derived from the query (normalized, raw, aliases) to OR-match
   * across name / displayName / brand / description / category.
   */
  textTerms?: string[];
}

/**
 * Map Prisma Product + relations into the UI's ProductWithHistory shape.
 * Defensive: lots of null checks so missing data never crashes.
 */
function mapToProductWithHistory(prismaProduct: any): ProductWithHistory {
  const listings =
    (prismaProduct.listings ?? []).map((l: any) => ({
      id: l.id,
      storeName: l.storeName,
      storeLogoUrl: l.storeLogoUrl ?? null,
      url: l.url ?? null,
      imageUrl:
        l.imageUrl ??
        prismaProduct.imageUrl ??
        prismaProduct.thumbnailUrl ??
        null,
      price: typeof l.price === "number" ? l.price : 0,
      currency: l.currency ?? "USD",
      shippingCost:
        typeof l.shippingCost === "number" ? l.shippingCost : null,
      deliveryTimeDays:
        typeof l.deliveryTimeDays === "number"
          ? l.deliveryTimeDays
          : typeof l.estimatedDeliveryDays === "number"
          ? l.estimatedDeliveryDays
          : typeof l.deliveryDays === "number"
          ? l.deliveryDays
          : null,
      fastDelivery: !!(l.fastDelivery ?? l.isFastDelivery),
      location: l.location ?? null,
      inStock: typeof l.inStock === "boolean" ? l.inStock : true,
      rating: typeof l.rating === "number" ? l.rating : null,
      reviewCount:
        typeof l.reviewCount === "number" ? l.reviewCount : null,
      source: (l as any).source ?? null,
    })) ?? [];

  const priceHistory =
    (prismaProduct.priceHistory ?? []).map((h: any) => ({
      date:
        h.date instanceof Date
          ? h.date.toISOString().slice(0, 10)
          : String(h.date ?? ""),
      price: typeof h.price === "number" ? h.price : 0,
      currency: h.currency ?? "USD",
    })) ?? [];

  const mapped: any = {
    id: prismaProduct.id,
    name: prismaProduct.name,
    displayName: prismaProduct.displayName ?? prismaProduct.name,
    description: prismaProduct.description ?? null,
    category: prismaProduct.category ?? null,
    brand: prismaProduct.brand ?? null,
    imageUrl:
      prismaProduct.imageUrl ?? prismaProduct.thumbnailUrl ?? null,
    thumbnailUrl:
      prismaProduct.thumbnailUrl ?? prismaProduct.imageUrl ?? null,
    listings,
    priceHistory,
  };

  return mapped as ProductWithHistory;
}

/**
 * Core repo function used by productService.searchProducts().
 * Talks to Prisma and returns ProductWithHistory[] in UI shape.
 */
export async function findProductsWithHistory(
  query: string,
  options: ProductSearchOptions
): Promise<ProductWithHistory[]> {
  const normalizedQuery = normalizeSearchQuery(
    typeof query === "string" ? query : ""
  );

  const where: any = {};

  // ---- Product-level text search (case-insensitive) ----
  const textTerms =
    options.textTerms && options.textTerms.length > 0
      ? options.textTerms
      : normalizedQuery
      ? [normalizedQuery]
      : [];

  if (textTerms.length > 0) {
    const orFilters: any[] = [];

    for (const term of textTerms) {
      const t = typeof term === "string" ? term.trim() : "";
      if (!t) continue;

      orFilters.push(
        { name: { contains: t, } },
        { displayName: { contains: t, } },
        { brand: { contains: t, } },
        { description: { contains: t,  } },
        { category: { contains: t, } } // Added closing braces here
      );
    }

    where.OR = orFilters;
  }

  if (options.categoryHint) {
    where.AND = where.AND ?? [];
    where.AND.push({
      OR: [
        { category: { contains: options.categoryHint, } },
        { category: { equals: options.categoryHint, } },
      ],
    });
  }

  // ---- Listing-level filters ----
  if (options.location || options.store || options.fastOnly) {
    where.listings = { some: {} };
    const listingWhere: any = where.listings.some;

    if (options.location) {
      listingWhere.location = {
        contains: options.location,
      };
    }

    if (options.store) {
      listingWhere.storeName = {
        contains: options.store,
      };
    }

    if (options.fastOnly) {
      listingWhere.OR = [{ fastDelivery: true }, { isFastDelivery: true }];
    }
  }

  const prismaProducts = await prisma.product.findMany({
    where,
    include: {
      listings: true,
      priceHistory: {
        orderBy: { date: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let products = prismaProducts.map(mapToProductWithHistory);

  // ---- Application-level case-insensitive filter ----
  // SQLite `contains` is case-sensitive, so we apply a second pass in JS
  // to ensure case-insensitive matching.
  if (textTerms.length > 0) {
    const lowerTerms = textTerms
      .map((t) => (typeof t === "string" ? t.trim().toLowerCase() : ""))
      .filter(Boolean);

    if (lowerTerms.length > 0) {
      products = products.filter((p) => {
        // Build a lowercase haystack from all searchable fields
        const haystack = [
          p.name,
          p.displayName,
          p.brand,
          p.category,
        ]
          .filter((v): v is string => typeof v === "string" && v.length > 0)
          .join(" ")
          .toLowerCase();

        // Require ALL terms to be present in the haystack
        return lowerTerms.every((term) => haystack.includes(term));
      });
    }
  }

  // ---- Filter out demo/DummyJSON products ----
  // This ensures end users never see demo data in search results.
  products = filterOutDemoProducts(products);

  // ---- Sorting ----
  if (options.sortBy === "price") {
    products.sort((a: any, b: any) => {
      const minPrice = (p: any) => {
        const prices = (p.listings ?? [])
          .map((l: any) => l.price)
          .filter((x: any) => typeof x === "number");
        if (!prices.length) return Number.POSITIVE_INFINITY;
        return Math.min(...prices);
      };
      return minPrice(a) - minPrice(b);
    });
  } else if (options.sortBy === "delivery") {
    products.sort((a: any, b: any) => {
      const minDays = (p: any) => {
        const days = (p.listings ?? [])
          .map(
            (l: any) =>
              l.deliveryTimeDays ??
              l.estimatedDeliveryDays ??
              l.deliveryDays
          )
          .filter((x: any) => typeof x === "number");
        if (!days.length) return Number.POSITIVE_INFINITY;
        return Math.min(...days);
      };
      return minDays(a) - minDays(b);
    });
  }

  return products;
}