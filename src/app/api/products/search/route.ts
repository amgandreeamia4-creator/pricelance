// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchProducts, type SortBy } from "@/lib/productService";
import { computeBestOffers } from "@/lib/bestOffer";
import { computeDealInfo } from "@/lib/dealUtils";
import {
  enrichSearchResultsIfNeeded,
  MIN_RESULTS_BEFORE_ENRICH,
  type EnrichmentResult,
} from "@/lib/searchEnrichment";
import {
  computeSearchStatus,
  type SearchStatus,
  type ProviderStatus,
} from "@/lib/searchStatus";

import { 
  normalizeSearchQuery, 
  normalizeUserQuery, 
  buildFallbackQueries,
  type NormalizedQueryInfo,
} from "@/lib/searchQuery";
import { getOrCreateUserId, attachUserIdCookie } from "@/lib/userIdentity";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchLocation = {
  country?: string;
  region?: string;
  city?: string;
} | null;

function inferProviderFromProductId(
  productId: string
): "dummyjson" | "demo" | "seed" | "unknown" {
  if (typeof productId === "string" && productId.startsWith("dummyjson-")) {
    return "dummyjson";
  }

  if (typeof productId === "string" && productId.startsWith("demo-")) {
    return "demo";
  }

  if (typeof productId === "string" && productId.length > 0) {
    return "seed";
  }

  return "unknown";
}

type ProductWithRelations = any;

type SearchRequestBody = {
  query?: string;
  sortBy?: SortBy;
  store?: string;
  fastOnly?: boolean;
  filters?: any;
  location?: SearchLocation;
  page?: number | string;
  pageSize?: number | string;
};

function buildOptionsFromSearchParams(searchParams: URLSearchParams) {
  const q = searchParams.get("q") ?? "";
  const locationParam = searchParams.get("location") ?? "";
  const sortByParam =
    (searchParams.get("sortBy") as SortBy | null) ?? "default";
  const storeParam = searchParams.get("store");
  const fastOnly = searchParams.get("fastOnly") === "true";
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  const options: any = {};
  if (locationParam) options.location = locationParam;
  if (sortByParam) options.sortBy = sortByParam;
  if (storeParam && storeParam !== "all") options.store = storeParam;
  if (fastOnly) options.fastOnly = true;
  if (pageParam) options.page = pageParam;
  if (pageSizeParam) options.pageSize = pageSizeParam;

  return { q, options };
}

/**
 * Internal result from running a full search (DB + enrichment).
 * Used for fallback logic.
 */
interface CoreSearchResult {
  products: any[];
  totalCount: number;
  enrichmentMeta: EnrichmentResult | null;
  searchMeta: any;
}

/**
 * Run the full search pipeline for a given query:
 * 1. Search DB
 * 2. Enrich from providers if needed
 * 3. Re-search DB after enrichment
 * 
 * Returns the raw products and metadata without pagination/sorting.
 */
async function runCoreSearch(
  query: string,
  options: any
): Promise<CoreSearchResult> {
  const initialResult = await searchProducts(query, options);
  let searchedProducts: any[] = initialResult.products ?? [];
  let searchMeta: any = initialResult.meta ?? {};
  const initialCount = searchedProducts.length;

  let enrichmentMeta: EnrichmentResult | null = null;

  if (query && query.trim() && initialCount < MIN_RESULTS_BEFORE_ENRICH) {
    enrichmentMeta = await enrichSearchResultsIfNeeded(query, initialCount);

    // Re-run DB search after enrichment
    const enrichedResult = await searchProducts(query, options);
    searchedProducts = enrichedResult.products ?? searchedProducts;
    searchMeta = enrichedResult.meta ?? searchMeta;
  }

  return {
    products: searchedProducts,
    totalCount: searchedProducts.length,
    enrichmentMeta,
    searchMeta,
  };
}

async function handleSearchRequest(req: NextRequest) {
  console.log(
    "[/api/products/search] handler hit with method:",
    req.method
  );

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rate = checkRateLimit(ip, 30, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many requests. Please try again shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)),
        },
      }
    );
  }

  const { userId, shouldSetCookie } = getOrCreateUserId(req);

  const { searchParams } = new URL(req.url);
  const { q: queryFromParams, options: optionsFromParams } =
    buildOptionsFromSearchParams(searchParams);

  let body: SearchRequestBody | null = null;
  if (req.method === "POST") {
    try {
      body = ((await req.json()) as SearchRequestBody) ?? null;
    } catch (error) {
      console.warn(
        "[/api/products/search] Failed to parse JSON body, falling back to query params",
        error
      );
    }
  }

  const query = body?.query ?? queryFromParams ?? "";
  const normalizedInfo = normalizeSearchQuery(query ?? "");
  const effectiveQuery = normalizedInfo.normalized;

  const sortBy = body?.sortBy ?? "default";
  const store = body?.store;
  const fastOnly = body?.fastOnly;
  const filters = body?.filters ?? null;
  const location: SearchLocation = body?.location ?? null;

  const rawPage = body?.page;
  const rawPageSize = body?.pageSize;

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(rawPageSize) || 10));

  const options: any = { ...optionsFromParams };
  // We rely on in-memory sorting using bestOffers; repository sortBy can be ignored or kept lightweight.

  if (store && store !== "all") options.store = store;
  if (typeof fastOnly === "boolean") options.fastOnly = fastOnly;

  // ========== FALLBACK SEARCH LOGIC ==========
  // 1. Run primary search with normalized query
  // 2. If 0 results, try fallback queries in order
  // 3. Track which query was actually used
  
  const nq = normalizeUserQuery(effectiveQuery);
  let fallbackQueryUsed: string | null = null;
  
  console.log("[/api/products/search] Running primary search for:", nq.normalized);
  
  // Run primary search
  let coreResult = await runCoreSearch(nq.normalized, options);
  
  // If no results, try fallback queries
  if (coreResult.totalCount === 0 && nq.normalized.length > 0) {
    const fallbackQueries = buildFallbackQueries(nq);
    
    if (fallbackQueries.length > 0) {
      console.log("[/api/products/search] No results for", nq.normalized, "→ trying fallbacks:", fallbackQueries);
      
      for (const fb of fallbackQueries) {
        const fbResult = await runCoreSearch(fb, options);
        
        if (fbResult.totalCount > 0) {
          console.log("[/api/products/search] Fallback query succeeded:", fb, "→ totalCount:", fbResult.totalCount);
          coreResult = fbResult;
          fallbackQueryUsed = fb;
          break;
        }
      }
      
      if (!fallbackQueryUsed) {
        console.log("[/api/products/search] All fallback queries returned 0 results");
      }
    }
  }
  
  const searchedProducts = coreResult.products;
  const searchMeta = coreResult.searchMeta;
  const enrichmentMeta = coreResult.enrichmentMeta;
  
  console.log("[/api/products/search] Final result:", {
    originalQuery: query,
    normalizedQuery: nq.normalized,
    fallbackQueryUsed,
    totalCount: coreResult.totalCount,
  });

  const userLocationText = location
    ? [location.city, location.region, location.country]
        .filter((v) => typeof v === "string" && v)
        .join(" ")
        .trim()
    : "";

  const enriched = (searchedProducts as any[]).map((p) => {
    const listings = (p.listings ?? []) as any[];
    const bestOffers = computeBestOffers(listings, userLocationText || null);

    const cheapest = bestOffers.cheapest as any | undefined;
    const fastest = bestOffers.fastest as any | undefined;
    const bestOverall = bestOffers.bestOverall as any | undefined;

    const shipping =
      typeof cheapest?.shippingCost === "number" ? cheapest.shippingCost : 0;
    const cheapestTotal =
      typeof cheapest?.price === "number"
        ? cheapest.price + shipping
        : Number.POSITIVE_INFINITY;

    const fastestDays =
      fastest && typeof fastest.deliveryDays === "number"
        ? fastest.deliveryDays
        : Number.POSITIVE_INFINITY;

    const bestScore =
      typeof bestOverall?.score === "number"
        ? bestOverall.score
        : Number.NEGATIVE_INFINITY;

    const dealInfo = computeDealInfo(p as ProductWithRelations);

    const provider = inferProviderFromProductId((p as any).id ?? "");

    return {
      ...p,
      bestOffers,
      dealInfo,
      provider,
      _cheapestTotal: cheapestTotal,
      _fastestDays: fastestDays,
      _bestScore: bestScore,
    };
  });

  const sortKey = (sortBy ?? "default").toString();

  enriched.sort((a: any, b: any) => {
    switch (sortKey) {
      case "price":
        return a._cheapestTotal - b._cheapestTotal;
      case "delivery":
        return a._fastestDays - b._fastestDays;
      case "default":
      default:
        // Higher score first
        return b._bestScore - a._bestScore;
    }
  });

  const totalCount = enriched.length;
  const { status, providerStatus } = computeSearchStatus(
    totalCount,
    enrichmentMeta,
  );

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const products = enriched.slice(skip, skip + take);

  console.log("[/api/products/search] result summary", {
    originalQuery: query,
    normalizedQuery: effectiveQuery,
    fallbackQueryUsed,
    totalCount,
    page,
    pageSize,
    returned: products.length,
    enrichmentMeta: enrichmentMeta ? {
      totalBefore: enrichmentMeta.totalBefore,
      totalAfter: enrichmentMeta.totalAfter,
      providerCalls: enrichmentMeta.providerCalls,
    } : null,
  });

  const bestOffersByProduct: Record<string, any> = {};
  for (const p of products as any[]) {
    const productId = p.id;
    if (!productId) continue;
    bestOffersByProduct[productId] = p.bestOffers ?? {};
  }

  const allListings = (products as any[]).flatMap(
    (p) => (p as any).listings ?? []
  );

  const productIds = (products as any[]).map((p) => (p as any).id);
  let favoriteProductIds: string[] = [];

  // Wrap Prisma call in try/catch for graceful degradation if DB is unavailable
  if (productIds.length > 0) {
    try {
      const favorites = await prisma.favorite.findMany({
        where: {
          userId,
          productId: { in: productIds },
        },
        select: { productId: true },
      });
      favoriteProductIds = favorites.map((f) => f.productId);
    } catch (dbError) {
      console.error("[/api/products/search] Failed to fetch favorites from DB:", dbError instanceof Error ? dbError.message : String(dbError));
      // Continue with empty favorites - search results still work
    }
  }

  // Best-effort search analytics logging (non-critical)
  if (query && query.trim().length > 0) {
    try {
      await prisma.searchLog.create({
        data: {
          query: query.trim(),
          resultCount: products.length,
        },
      });
    } catch (logError) {
      console.error(
        "[/api/products/search] Failed to log search to SearchLog:",
        logError instanceof Error ? logError.message : String(logError)
      );
      // Continue - search results must not fail because analytics logging failed
    }
  }

  const meta = {
    // Search-level info
    query: searchMeta.query,
    normalizedQuery: searchMeta.normalizedQuery,

    matchedCategory: searchMeta.matchedCategory,
    matchReason: searchMeta.matchReason,

    // Existing meta fields
    productCount: totalCount,
    offerCount: allListings.length,
    location: location ?? null,
    favoriteProductIds,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(totalCount / pageSize)),
    bestOffersByProduct,

    // Debug enrichment meta (optional, backwards-compatible)
    enrichment: enrichmentMeta,

    // Data status for UI to distinguish between "no results" and "provider failed"
    dataStatus: enrichmentMeta?.dataStatus ?? "ok",
    hadProviderTimeout: enrichmentMeta?.hadTimeout ?? false,
    hadProviderError: enrichmentMeta?.hadError ?? false,

    // Unified status fields for consistent UX across search and assistant
    status: status as SearchStatus,
    providerStatus: providerStatus as ProviderStatus,
  };

  // Wrap Prisma call in try/catch - saving search history is non-critical
  if (query && query.trim().length > 0) {
    try {
      await prisma.savedSearch.create({
        data: {
          userId,
          query: query.trim(),

          filters: {
            filters: filters ?? null,
            location: location ?? null,
          },
        },
      });
    } catch (dbError) {
      console.error("[/api/products/search] Failed to save search to DB:", dbError instanceof Error ? dbError.message : String(dbError));
      // Continue - search results still work without saving history
    }
  }

  const res = NextResponse.json({
    ok: true,
    status,
    providerStatus,
    products,
    meta: {
      ...meta,
      // Fallback query info for UI to show "Showing results for X instead"
      originalQuery: query,
      fallbackQueryUsed,
    },
    query: normalizedInfo.original,
    normalizedQuery: normalizedInfo.normalized,
    isVague: normalizedInfo.isVague,
    usedAlias: normalizedInfo.usedAlias,
    // Top-level fallback info for easy access
    fallbackQueryUsed,
  });

  if (shouldSetCookie) {
    return attachUserIdCookie(res, userId);
  }

  return res;
}

export async function GET(req: NextRequest) {
  try {
    return await handleSearchRequest(req);
  } catch (error) {
    console.error("[/api/products/search] GET Failed:", error);
    return NextResponse.json(
      { ok: false, products: [], total: 0, error: "search_failed" },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleSearchRequest(req);
  } catch (error) {
    console.error("[/api/products/search] Failed to load products:", error);

    return NextResponse.json(
      {
        ok: false,
        products: [],
        total: 0,
        error: "search_failed",
        message:
          process.env.NODE_ENV === "development"
            ? `Internal error loading products: ${String(error)}`
            : "Internal error loading products.",
      },
      { status: 200 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true, method: "OPTIONS" });
}