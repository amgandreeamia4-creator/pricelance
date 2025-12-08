// src/lib/productService.ts
import type { ProductWithHistory } from "@/types/product";
import {
  findProductsWithHistory,
  type ProductSearchOptions,
} from "@/lib/productRepository";

export type SortBy = "default" | "price" | "delivery";

export interface SearchOptions {
  location?: string;
  sortBy?: SortBy;
  store?: string;
  fastOnly?: boolean;
}

export interface NormalizedQueryInfo {
  raw: string;
  normalized: string;
  categoryHint: string | null;
  extraKeywords: string[];
}

export interface SearchMeta {
  query: string;
  normalizedQuery: string;
  matchedCategory: string | null;
  matchReason: string | null;
}

const ALIAS_GROUPS: {
  terms: string[];
  category: string;
}[] = [
  {
    // perfume / fragrance family
    terms: ["perfume", "perfumes", "fragrance", "fragrances"],
    category: "fragrances",
  },
  {
    // phone / smartphone family
    terms: ["phone", "phones", "smartphone", "smartphones"],
    category: "smartphones",
  },
  {
    // skincare / beauty family
    terms: ["skincare", "skin care"],
    category: "beauty",
  },
  {
    // groceries family (kept for future tuning, still useful as a hint)
    terms: ["groceries"],
    category: "groceries",
  },
];

const KNOWN_CATEGORIES = new Set(ALIAS_GROUPS.map((g) => g.category));

function normalizeQuery(raw: string): NormalizedQueryInfo {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  const lower = trimmed.toLowerCase();

  if (!lower) {
    return {
      raw: trimmed,
      normalized: "",
      categoryHint: null,
      extraKeywords: [],
    };
  }

  for (const group of ALIAS_GROUPS) {
    if (group.terms.includes(lower)) {
      return {
        raw: trimmed,
        normalized: group.terms[0],
        categoryHint: group.category,
        extraKeywords: Array.from(new Set(group.terms)),
      };
    }
  }

  if (KNOWN_CATEGORIES.has(lower)) {
    return {
      raw: trimmed,
      normalized: lower,
      categoryHint: lower,
      extraKeywords: [lower],
    };
  }

  return {
    raw: trimmed,
    normalized: lower,
    categoryHint: null,
    extraKeywords: [],
  };
}

function buildMatchReason(info: NormalizedQueryInfo): string | null {
  if (!info.normalized) return null;

  if (info.categoryHint) {
    const fromAlias = ALIAS_GROUPS.find((g) =>
      g.terms.includes(info.normalized)
    );

    if (fromAlias && info.categoryHint !== info.normalized) {
      return `alias:${info.normalized}->${info.categoryHint}`;
    }

    if (KNOWN_CATEGORIES.has(info.categoryHint)) {
      return `category:${info.categoryHint}`;
    }
  }

  return "text";
}

/**
 * Helper used by UI components (e.g. ProductList) to pick
 * a "best" listing for display.
 *
 * Current logic: choose the listing with the lowest numeric price.
 * If no prices are numeric, fall back to the first listing.
 */
export function getBestListing(
  product: ProductWithHistory | null | undefined
): ProductWithHistory["listings"][number] | null {
  if (!product || !Array.isArray(product.listings) || product.listings.length === 0) {
    return null;
  }

  const listings = product.listings;

  let best = listings[0];
  for (const listing of listings) {
    const currentPrice =
      typeof listing.price === "number" ? listing.price : Number.POSITIVE_INFINITY;
    const bestPrice =
      typeof best.price === "number" ? best.price : Number.POSITIVE_INFINITY;

    if (currentPrice < bestPrice) {
      best = listing;
    }
  }

  return best;
}

/**
 * Core search function used by /api/products/search and the UI.
 * Returns both products and lightweight search meta.
 */
export async function searchProducts(
  query: string,
  options?: SearchOptions
): Promise<{ products: ProductWithHistory[]; meta: SearchMeta }> {
  const info = normalizeQuery(query);

  const textTerms = Array.from(
    new Set(
      [info.normalized, info.raw.toLowerCase(), ...info.extraKeywords]
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );

  const repoOptions: ProductSearchOptions = {
    location: options?.location,
    sortBy: options?.sortBy ?? "default",
    store: options?.store,
    fastOnly: options?.fastOnly ?? false,
    categoryHint: info.categoryHint,
    textTerms,
  };

  const products = await findProductsWithHistory(info.normalized, repoOptions);

  const meta: SearchMeta = {
    query: info.raw,
    normalizedQuery: info.normalized,
    matchedCategory: info.categoryHint,
    matchReason: buildMatchReason(info),
  };

  return { products, meta };
}