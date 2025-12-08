// src/lib/providers/realStoreProvider.ts
import type { ProductProvider, ProviderSearchResult, ProviderErrorType } from "./types";
import type { IngestPayload, IngestProductInput, IngestListingInput, IngestResult } from "@/lib/ingestService";
import { ingestProducts } from "@/lib/ingestService";
import { providerConfigs } from "@/config/providerConfig";

/**
 * Result returned by searchAndIngest for debug/meta purposes.
 */
export interface RealStoreSearchResult {
  count: number;
  productIds: string[];
}

function getRealStoreConfig() {
  return providerConfigs.find((c) => c.id === "realstore");
}

// ========= Real-Time Product Search API types (partial) =========

interface RTPProductOffer {
  store_name?: string;
  store_rating?: number | null;
  offer_page_url?: string;
  store_review_count?: number | null;
  price?: string; // e.g. "$272.00"
  shipping?: string; // e.g. "$14.95 delivery"
  tax?: string | null;
  on_sale?: boolean;
  original_price?: string | null;
  product_condition?: string | null;
  top_quality_store?: boolean | null;
}

interface RTPProduct {
  product_title?: string;
  product_photos?: string[];
  product_rating?: number;
  product_page_url?: string;
  product_offers_page_url?: string;
  product_specs_page_url?: string;
  product_reviews_page_url?: string;
  product_num_reviews?: number;
  product_num_offers?: string;
  typical_price_range?: string[];
  offer?: RTPProductOffer;
  offers?: RTPProductOffer[];
  offer_list?: RTPProductOffer[];
}

interface RTPSearchResponse {
  status?: string;
  request_id?: string;
  data?: RTPProduct[];
  products?: RTPProduct[];
}

// ========= Helpers =========

function extractNumeric(value?: string | null): number | null {
  if (!value) return null;
  // Strip everything except digits, dot, and comma, then normalize comma to dot.
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferCurrencySymbol(price?: string | null): string | null {
  if (!price) return null;
  if (price.includes("€")) return "EUR";
  if (price.includes("£")) return "GBP";
  if (price.includes("$")) return "USD";
  return null;
}

function buildListingsFromItem(item: RTPProduct, options: {
  fallbackPriceSource?: string | null;
  imageUrl?: string | null;
  maxOffers?: number;
}): IngestListingInput[] {
  const { fallbackPriceSource, imageUrl, maxOffers = 5 } = options;

  const anyItem = item as any;
  let rawOffers: RTPProductOffer[] = [];

  if (Array.isArray(item.offers)) {
    rawOffers = item.offers;
  } else if (Array.isArray(item.offer_list)) {
    rawOffers = item.offer_list;
  } else if (Array.isArray(anyItem?.offers)) {
    rawOffers = anyItem.offers as RTPProductOffer[];
  } else if (Array.isArray(anyItem?.offer_list)) {
    rawOffers = anyItem.offer_list as RTPProductOffer[];
  } else if (item.offer) {
    rawOffers = [item.offer];
  }

  const seen = new Set<string>();
  const listings: IngestListingInput[] = [];

  for (const offer of rawOffers) {
    const rawPrice = offer.price ?? fallbackPriceSource ?? null;
    const priceNumber = extractNumeric(rawPrice);

    const url =
      offer.offer_page_url ??
      item.product_offers_page_url ??
      item.product_page_url ??
      null;

    if (!(priceNumber != null && priceNumber > 0 && url)) {
      continue;
    }

    const currency =
      inferCurrencySymbol(offer.price ?? fallbackPriceSource ?? null) ??
      "USD";

    const shippingCost = extractNumeric(offer.shipping ?? null) ?? undefined;

    const storeName = offer.store_name ?? "Unknown store";

    const key = `${storeName}|${url}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let fastDelivery: boolean | undefined;
    const deliveryTag = (offer as any)?.delivery_tag as string | undefined;
    if (typeof deliveryTag === "string") {
      if (/same day|1-day|2-day|express/i.test(deliveryTag)) {
        fastDelivery = true;
      }
    }

    listings.push({
      storeName,
      storeLogoUrl: undefined,
      url,
      imageUrl: imageUrl ?? undefined,
      price: priceNumber,
      currency,
      shippingCost,
      fastDelivery,
      location: undefined,
      inStock: true,
      rating:
        typeof (offer.store_rating ?? item.product_rating) === "number"
          ? (offer.store_rating ?? item.product_rating) ?? undefined
          : undefined,
      reviewCount:
        typeof item.product_num_reviews === "number"
          ? item.product_num_reviews
          : undefined,
      source: "aggregator",
    });

    if (listings.length >= maxOffers) break;
  }

  // Fallback: if there were no usable offers, try to salvage a single listing
  if (listings.length === 0 && item.offer) {
    const offer = item.offer;
    const rawPrice = offer.price ?? fallbackPriceSource ?? null;
    const priceNumber = extractNumeric(rawPrice) ?? 0;
    const url =
      offer.offer_page_url ??
      item.product_offers_page_url ??
      item.product_page_url ??
      null;

    listings.push({
      storeName: offer.store_name ?? "Online store",
      storeLogoUrl: undefined,
      url: url ?? undefined,
      imageUrl: imageUrl ?? undefined,
      price: priceNumber,
      currency:
        inferCurrencySymbol(offer.price ?? fallbackPriceSource ?? null) ??
        "USD",
      shippingCost: extractNumeric(offer.shipping ?? null) ?? undefined,
      fastDelivery: undefined,
      location: undefined,
      inStock: true,
      rating:
        typeof (offer.store_rating ?? item.product_rating) === "number"
          ? (offer.store_rating ?? item.product_rating) ?? undefined
          : undefined,
      reviewCount:
        typeof item.product_num_reviews === "number"
          ? item.product_num_reviews
          : undefined,
      source: "aggregator",
    });
  }

  return listings;
}

// ========= Provider implementation =========

export const realStoreProvider: ProductProvider & {
  searchAndIngest: (options: {
    query: string;
    country?: string;
    limit?: number;
  }) => Promise<RealStoreSearchResult>;
} = {
  name: "realstore",

  /**
   * Search for products with detailed status/error information.
   * This is the preferred method for better error handling.
   */
  async searchProductsWithStatus(query: string): Promise<ProviderSearchResult> {
    console.log("[realStoreProvider] searchProductsWithStatus called", { query });

    const cfg = getRealStoreConfig();
    if (!cfg || !cfg.enabled) {
      console.log("[realStoreProvider] Provider disabled or config missing", {
        configFound: !!cfg,
        enabled: cfg?.enabled,
      });
      return {
        payloads: [],
        error: {
          type: "config_missing" as ProviderErrorType,
          message: "Provider is disabled or not configured",
        },
      };
    }

    // Resolve base URL: env var or config or default
    const baseUrl =
      (process.env.REALTIME_PRODUCT_SEARCH_BASE_URL ?? cfg.baseUrl ?? "https://real-time-product-search.p.rapidapi.com").replace(/\/$/, "");

    const apiKeyEnvName = cfg.apiKeyEnvVar ?? "REALTIME_PRODUCT_SEARCH_API_KEY";
    const apiKey = process.env[apiKeyEnvName];

    console.log("[realStoreProvider] Config resolved", {
      baseUrl,
      apiKeyEnvName,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length ?? 0,
    });

    if (!baseUrl || !apiKey) {
      const msg = `Missing baseUrl or RapidAPI key (${apiKeyEnvName})`;
      console.warn(`[realStoreProvider] ${msg}. Skipping aggregator provider.`);
      return {
        payloads: [],
        error: {
          type: "config_missing" as ProviderErrorType,
          message: msg,
        },
      };
    }

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      console.log("[realStoreProvider] Empty query after trim, returning []");
      return { payloads: [] };
    }

    const timeoutMs = cfg.timeoutMs ?? 8000;

    // Build the full URL for the search endpoint
    const url = `${baseUrl}/search-v2?q=${encodeURIComponent(
      normalizedQuery
    )}&country=us&language=en&page=1&limit=10&sort_by=BEST_MATCH&product_condition=ANY`;

    console.log("[realStoreProvider] Fetching URL:", url);
    console.log("[realStoreProvider] Headers: X-RapidAPI-Host=real-time-product-search.p.rapidapi.com, X-RapidAPI-Key=[REDACTED]");
    console.log("[realStoreProvider] Timeout:", timeoutMs, "ms");

    // Use AbortController to enforce timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      console.log("[realStoreProvider] Starting fetch at", new Date().toISOString());
      res = await fetch(url, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "real-time-product-search.p.rapidapi.com",
        },
        signal: controller.signal,
        cache: "no-store", // Disable Next.js fetch caching
      });
      console.log("[realStoreProvider] Fetch completed at", new Date().toISOString(), "status:", res.status);
    } catch (err: unknown) {
      clearTimeout(timeout);
      const error = err as Error;
      if (error?.name === "AbortError") {
        const msg = `Fetch TIMEOUT after ${timeoutMs}ms for query "${normalizedQuery}"`;
        console.error(`[realStoreProvider] ${msg}`);
        return {
          payloads: [],
          error: {
            type: "timeout" as ProviderErrorType,
            message: msg,
          },
        };
      } else {
        const msg = `Network error: ${error?.message ?? String(err)}`;
        console.error("[realStoreProvider] Fetch error for query", normalizedQuery, err);
        return {
          payloads: [],
          error: {
            type: "network_error" as ProviderErrorType,
            message: msg,
          },
        };
      }
    } finally {
      clearTimeout(timeout);
    }

    // Check for non-OK response
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg = `HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`;
      console.error(
        "[realStoreProvider] Non-OK response",
        res.status,
        res.statusText,
        "body snippet:",
        text.slice(0, 300)
      );
      return {
        payloads: [],
        error: {
          type: "http_error" as ProviderErrorType,
          message: msg,
          httpStatus: res.status,
        },
      };
    }

    // Safely parse JSON
    let json: Record<string, unknown>;
    try {
      json = await res.json();
    } catch (err) {
      const msg = `Failed to parse JSON response: ${err instanceof Error ? err.message : String(err)}`;
      console.error("[realStoreProvider] Failed to parse JSON:", err);
      return {
        payloads: [],
        error: {
          type: "parse_error" as ProviderErrorType,
          message: msg,
        },
      };
    }

    console.log(
      "[realStoreProvider] Top-level JSON keys for",
      normalizedQuery,
      ":",
      Object.keys(json || {})
    );

    // Extract items robustly from various possible response structures
    const dataField = json?.data as Record<string, unknown> | unknown[] | undefined;
    const candidates =
      (Array.isArray(dataField) ? undefined : (dataField as Record<string, unknown>)?.products) ??
      dataField ??
      json?.products ??
      json?.items ??
      [];
    const items: RTPProduct[] = Array.isArray(candidates) ? candidates as RTPProduct[] : [];

    console.log(
      "[realStoreProvider] Parsed items length for",
      normalizedQuery,
      ":",
      items.length
    );

    if (items.length === 0) {
      console.warn(
        "[realStoreProvider] No items found. Raw JSON sample (keys + first object if any):",
        {
          keys: Object.keys(json || {}),
          status: json?.status,
          request_id: json?.request_id,
          dataType: typeof json?.data,
          dataIsArray: Array.isArray(json?.data),
          firstDataItem: Array.isArray(json?.data) ? (json.data as unknown[])[0] : undefined,
          snippet: JSON.stringify(json).slice(0, 400),
        }
      );
      // This is NOT an error - the API returned successfully but with 0 results
      return { payloads: [] };
    }

    // Map all items into IngestProductInput objects
    const products: IngestProductInput[] = items.map(
      (item: RTPProduct, index: number) => {
        const title = item.product_title ?? normalizedQuery;
        const imageUrl = item.product_photos?.[0] ?? null;

        const fallbackPriceSource = item.typical_price_range?.[0] ?? null;

        const listings = buildListingsFromItem(item, {
          fallbackPriceSource,
          imageUrl,
          maxOffers: 5,
        });

        const productId = `rtp-${normalizedQuery}-${index}`;

        if (index < 3) {
          console.log("[realStoreProvider] item offers summary", {
            index,
            productId,
            title: title.slice(0, 60),
            offersCount: listings.length,
            rawNumOffers: item.product_num_offers,
          });
        }

        const product: IngestProductInput = {
          id: productId,
          name: title,
          displayName: title,
          description: "",
          category: undefined,
          brand: undefined,
          imageUrl,
          thumbnailUrl: imageUrl,
          listings,
          priceHistory: [],
        };

        return product;
      }
    );

    console.log(
      "[realStoreProvider] Mapped",
      products.length,
      "products for query",
      normalizedQuery
    );

    // Return as a single payload array (same format as staticProvider)
    const payload: IngestPayload = products;
    return { payloads: [payload] };
  },

  /**
   * Search for products and return IngestPayload arrays (legacy interface).
   * Does NOT ingest into DB – caller is responsible for that.
   */
  async searchProducts(query: string): Promise<IngestPayload[]> {
    // Use the new searchProductsWithStatus and extract just the payloads
    // We know searchProductsWithStatus exists on this object, so we can safely call it
    const result = await this.searchProductsWithStatus!(query);
    return result.payloads;
  },

  /**
   * Search for products AND ingest them into the database.
   * Returns count and productIds for debug/meta purposes.
   */
  async searchAndIngest(options: {
    query: string;
    country?: string;
    limit?: number;
  }): Promise<RealStoreSearchResult> {
    const { query, country, limit } = options;

    console.log("[realStoreProvider] searchAndIngest called", {
      query,
      country: country ?? "us",
      limit: limit ?? 10,
    });

    const cfg = getRealStoreConfig();
    if (!cfg || !cfg.enabled) {
      console.log("[realStoreProvider] Provider disabled or config missing");
      return { count: 0, productIds: [] };
    }

    // Resolve base URL: env var or config or default
    const baseUrl =
      (process.env.REALTIME_PRODUCT_SEARCH_BASE_URL ?? cfg.baseUrl ?? "https://real-time-product-search.p.rapidapi.com").replace(/\/$/, "");

    const apiKeyEnvName = cfg.apiKeyEnvVar ?? "REALTIME_PRODUCT_SEARCH_API_KEY";
    const apiKey = process.env[apiKeyEnvName];

    console.log("[realStoreProvider] searchAndIngest config resolved", {
      baseUrl,
      hasApiKey: !!apiKey,
    });

    if (!baseUrl || !apiKey) {
      console.warn("[realStoreProvider] Missing baseUrl or API key; skipping provider.");
      return { count: 0, productIds: [] };
    }

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return { count: 0, productIds: [] };
    }

    const timeoutMs = cfg.timeoutMs ?? 8000;
    const effectiveLimit = limit ?? 10;
    const effectiveCountry = country ?? "us";

    const url = `${baseUrl}/search-v2?q=${encodeURIComponent(
      normalizedQuery
    )}&country=${effectiveCountry}&language=en&page=1&limit=${effectiveLimit}&sort_by=BEST_MATCH&product_condition=ANY`;

    console.log("[realStoreProvider] searchAndIngest fetching URL:", url);

    // Use AbortController to enforce timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "real-time-product-search.p.rapidapi.com",
        },
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeout);
      if (err?.name === "AbortError") {
        console.error(
          `[realStoreProvider] searchAndIngest TIMEOUT after ${timeoutMs}ms for query "${normalizedQuery}"`
        );
      } else {
        console.error("[realStoreProvider] searchAndIngest fetch error", err);
      }
      return { count: 0, productIds: [] };
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[realStoreProvider] searchAndIngest Non-OK response",
        res.status,
        res.statusText,
        "body snippet:",
        text.slice(0, 300)
      );
      return { count: 0, productIds: [] };
    }

    let json: any;
    try {
      json = await res.json();
    } catch (err) {
      console.error("[realStoreProvider] searchAndIngest failed to parse JSON:", err);
      return { count: 0, productIds: [] };
    }

    console.log(
      "[realStoreProvider] searchAndIngest top-level JSON keys:",
      Object.keys(json || {})
    );

    // Extract items robustly
    const candidates =
      json?.data?.products ??
      json?.data ??
      json?.products ??
      json?.items ??
      [];
    const items: RTPProduct[] = Array.isArray(candidates) ? candidates : [];

    console.log(
      `[realStoreProvider] searchAndIngest parsed ${items.length} items for query "${normalizedQuery}"`
    );

    if (items.length === 0) {
      console.warn(
        "[realStoreProvider] searchAndIngest no items found. Raw JSON sample:",
        JSON.stringify(json).slice(0, 400)
      );
      return { count: 0, productIds: [] };
    }

    // Map to normalized products
    const normalizedProducts: IngestProductInput[] = items.map((item, index) => {
      const title = item.product_title ?? normalizedQuery;
      const imageUrl = item.product_photos?.[0] ?? null;
      const offer = item.offer;

      const priceNumber =
        extractNumeric(offer?.price) ??
        extractNumeric(item.typical_price_range?.[0]) ??
        0;
      const currency =
        inferCurrencySymbol(offer?.price) ??
        inferCurrencySymbol(item.typical_price_range?.[0]) ??
        "USD";

      const shippingCost = extractNumeric(offer?.shipping);
      const productId = `rtp-${normalizedQuery}-${index}`;

      return {
        id: productId,
        name: title,
        displayName: title,
        description: "",
        category: undefined,
        brand: undefined,
        imageUrl,
        thumbnailUrl: imageUrl,
        listings: [
          {
            storeName: offer?.store_name ?? "Online store",
            storeLogoUrl: undefined,
            url:
              offer?.offer_page_url ??
              item.product_offers_page_url ??
              item.product_page_url ??
              undefined,
            imageUrl: imageUrl ?? undefined,
            price: priceNumber,
            currency,
            shippingCost: shippingCost ?? undefined,
            fastDelivery: undefined,
            location: undefined,
            inStock: true,
            rating:
              typeof (offer?.store_rating ?? item.product_rating) === "number"
                ? (offer?.store_rating ?? item.product_rating) ?? undefined
                : undefined,
            reviewCount:
              typeof item.product_num_reviews === "number"
                ? item.product_num_reviews
                : undefined,
            source: "aggregator",
          },
        ],
        priceHistory: [],
      };
    });

    console.log(
      "[realStoreProvider] searchAndIngest mapped",
      normalizedProducts.length,
      "products for query",
      normalizedQuery
    );

    // Ingest products into DB
    let ingestResult: IngestResult = { count: 0, productIds: [] };
    try {
      ingestResult = await ingestProducts(normalizedProducts);

      console.log("[realStoreProvider] searchAndIngest ingested products", {
        query: normalizedQuery,
        provider: "realstore",
        count: ingestResult.count,
        productIds: ingestResult.productIds,
      });
    } catch (err) {
      console.error("[realStoreProvider] searchAndIngest error ingesting products", err);
    }

    return {
      count: ingestResult.count,
      productIds: ingestResult.productIds,
    };
  },
};