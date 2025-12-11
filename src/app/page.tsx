"use client";

import React, { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import LocationSelector from "@/components/LocationSelector";
import ResultControls from "@/components/ResultControls";
import ProductList from "@/components/ProductList";
import ProductSummary from "@/components/ProductSummary";
import PriceTrendChart from "@/components/PriceTrendChart";
import { ChatAssistant } from "@/components/ChatAssistant";
import DealList from "@/components/DealList";
import SearchInsights from "./components/SearchInsights";
import { SearchEmptyState } from "@/components/SearchEmptyState";
import { SearchDebugStrip } from "@/components/SearchDebugStrip";
import { AdBanner } from "@/components/AdBanner";
import { AdSidebarBox } from "@/components/AdSidebarBox";
import type { ProductWithHistory } from "@/types/product";
import type { DealDto } from "@/lib/dealsClient";
import { fetchDeals } from "@/lib/dealsClient";
import { getJson, postJson } from "@/lib/apiClient";
import { appConfig } from "@/config/appConfig";
import { ThemeToggle } from "@/components/ThemeToggle";

// ---- Relax TypeScript for UI components so props never cause errors ----
const SearchBarAny = SearchBar as any;
const LocationSelectorAny = LocationSelector as any;
const ResultControlsAny = ResultControls as any;
const ProductListAny = ProductList as any;
const ProductSummaryAny = ProductSummary as any;
const PriceTrendChartAny = PriceTrendChart as any;
const ChatAssistantAny = ChatAssistant as any;
const SearchInsightsAny = SearchInsights as any;
// ------------------------------------------------------------------------

type SortBy = "default" | "price" | "delivery";

type ViewMode = "search" | "deals";

type SearchLocation = {
  country?: string;
  region?: string;
  city?: string;
};

type SavedSearch = {
  id: string;
  query: string;
  filters: any | null;
  createdAt: string;
};

type FavoriteEntry = {
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    displayName?: string | null;
    brand?: string | null;
    category?: string | null;
    listings?: {
      id: string;
      price: number;
      currency: string;
      storeName: string;
    }[];
  };
};

type DataStatus = "ok" | "partial" | "provider_timeout" | "provider_error" | "no_providers";

type ResultsMeta = {
  productCount?: number;
  offerCount?: number;
  cheapestTotalPriceText?: string;
  cheapestStore?: string;
  cheapestProductName?: string;
  fastestDays?: number | null;
  fastestStore?: string | null;
  fastestProductName?: string | null;
  favoriteProductIds?: string[];
  page?: number;
  pageSize?: number;
  pageCount?: number;
  enrichment?: {
    totalBefore?: number;
    totalAfter?: number;
    providerCalls?: { name: string; ingestedCount: number; error?: string; errorType?: string }[];
    dataStatus?: DataStatus;
    hadTimeout?: boolean;
    hadError?: boolean;
  } | null;
  location?: SearchLocation | null;
  dataStatus?: DataStatus;
  hadProviderTimeout?: boolean;
  hadProviderError?: boolean;
  // Fallback query info
  originalQuery?: string;
  fallbackQueryUsed?: string | null;
} | null;

const SAVED_KEY = "pricecompare:savedProducts";
const RECENT_KEY = "pricecompare:recentSearches";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<SearchLocation | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const [mode, setMode] = useState<ViewMode>("search");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [fastOnly, setFastOnly] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [results, setResults] = useState<ProductWithHistory[]>([]);
  const [resultsMeta, setResultsMeta] = useState<ResultsMeta>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoadingSavedSearches, setIsLoadingSavedSearches] = useState(false);
  const [savedSearchesError, setSavedSearchesError] = useState<string | null>(
    null,
  );
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealDto[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsError, setDealsError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [pageCount, setPageCount] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [normalizedQuery, setNormalizedQuery] = useState<string | undefined>();
  const [isVague, setIsVague] = useState<boolean | undefined>();
  const [usedAlias, setUsedAlias] = useState<string | null | undefined>();

  const [enrichmentMeta, setEnrichmentMeta] = useState<{
    totalBefore?: number;
    totalAfter?: number;
    providerCalls?: { name: string; ingestedCount: number }[];
  } | null>(null);

  const [showAssistant, setShowAssistant] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedRaw = localStorage.getItem(SAVED_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed)) {
          setSavedProductIds(parsed);
        }
      }
    } catch {
      // ignore
    }

    try {
      const recentRaw = localStorage.getItem(RECENT_KEY);
      if (recentRaw) {
        const parsed = JSON.parse(recentRaw);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedProductIds));
    } catch {
      // ignore
    }
  }, [savedProductIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches));
    } catch {
      // ignore
    }
  }, [recentSearches]);

  const loadFavorites = async () => {
    try {
      setIsLoadingFavorites(true);
      setFavoritesError(null);

      const data = await getJson<{
        ok: boolean;
        favorites?: FavoriteEntry[];
      }>("/api/favorites");

      if (data.ok && Array.isArray(data.favorites)) {
        setFavorites(data.favorites as FavoriteEntry[]);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error("[favorites] load error:", error);
      setFavorites([]);
      setFavoritesError("Couldn't load favorites.");
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  useEffect(() => {
    void loadFavorites();
  }, []);

  const loadSavedSearches = async () => {
    try {
      setIsLoadingSavedSearches(true);
      setSavedSearchesError(null);

      const data = await getJson<{
        ok: boolean;
        savedSearches?: SavedSearch[];
      }>("/api/saved-searches");

      if (data.ok && Array.isArray(data.savedSearches)) {
        setSavedSearches(data.savedSearches as SavedSearch[]);
      } else {
        setSavedSearches([]);
      }
    } catch (error) {
      console.error("[saved-searches] load error:", error);
      setSavedSearches([]);
      setSavedSearchesError("Saved searches unavailable right now.");
    } finally {
      setIsLoadingSavedSearches(false);
    }
  };

  useEffect(() => {
    void loadSavedSearches();
  }, []);

  const selectedProduct =
    results.find((p) => (p as any).id === selectedProductId) ?? null;

  const handleUseMyLocation = () => {
    setLocation({ country: "RO", region: "Bucharest", city: "Bucharest" });
    setShowLocationPanel(false);
  };

  const handleLocationSelect = (nextLocation: SearchLocation | null) => {
    setLocation(nextLocation);
    setShowLocationPanel(false);
  };

  const runSearchWithPage = async (
    targetPage: number,
    overrideQuery?: string,
  ) => {
    const effectiveQuery = (overrideQuery ?? query).trim();
    if (!effectiveQuery) return;
    setMode("search");
    setIsSearching(true);
    setSearchError(null);

    try {
      const payload: any = {
        query: effectiveQuery,
        sortBy,
        store: storeFilter !== "all" ? storeFilter : undefined,
        fastOnly,
        location: location ?? null,
        page: targetPage,
        pageSize,
      };

      let data: {
        ok: boolean;
        products: ProductWithHistory[];
        meta?: {
          enrichment?: {
            totalBefore?: number;
            totalAfter?: number;
            providerCalls?: { name: string; ingestedCount: number }[];
          };
          [key: string]: any;
        };
        query?: string;
        normalizedQuery?: string;
        isVague?: boolean;
        usedAlias?: string | null;
      } | null = null;

      try {
        data = await postJson<{
          ok: boolean;
          products: ProductWithHistory[];
          meta?: {
            enrichment?: {
              totalBefore?: number;
              totalAfter?: number;
              providerCalls?: { name: string; ingestedCount: number }[];
            };
            [key: string]: any;
          };
          query?: string;
          normalizedQuery?: string;
          isVague?: boolean;
          usedAlias?: string | null;
        }>("/api/products/search", payload);
      } catch (error) {
        console.error("Product search request failed:", error);
        data = {
          ok: false,
          products: [],
          meta: undefined,
          query: effectiveQuery,
          normalizedQuery: effectiveQuery,
          isVague: undefined,
          usedAlias: undefined,
        };
      }

      const products: ProductWithHistory[] = data.products ?? [];

      setResults(products);
      setResultsMeta(data.meta ?? null);
      setEnrichmentMeta(data.meta?.enrichment ?? null);

      if (typeof data.normalizedQuery === "string") {
        setNormalizedQuery(data.normalizedQuery);
      } else {
        setNormalizedQuery(undefined);
      }

      if (typeof data.isVague === "boolean") {
        setIsVague(data.isVague);
      } else {
        setIsVague(undefined);
      }

      if (typeof data.usedAlias === "string" || data.usedAlias === null) {
        setUsedAlias(data.usedAlias);
      } else {
        setUsedAlias(undefined);
      }

      if (data.meta?.location) {
        setLocation(data.meta.location as SearchLocation);
      }

      const metaFavoriteIds: string[] =
        (data.meta?.favoriteProductIds as string[] | undefined) ?? [];
      setFavoriteProductIds(metaFavoriteIds);

      if (typeof data.meta?.page === "number") {
        setPage(data.meta.page);
      }
      if (typeof data.meta?.pageCount === "number") {
        setPageCount(data.meta.pageCount);
      }
      if (typeof data.meta?.productCount === "number") {
        setTotalProducts(data.meta.productCount);
      }

      setSelectedProductId((prev) => {
        if (prev && products.some((p) => (p as any).id === prev)) {
          return prev;
        }
        return products.length > 0 ? ((products[0] as any).id ?? null) : null;
      });

      setRecentSearches((prev) => {
        const next = [
          effectiveQuery,
          ...prev.filter((q) => q !== effectiveQuery),
        ].slice(0, 6);
        return next;
      });
    } catch (err) {
      console.error("[search] error:", err);
      setSearchError("Couldn't load products. Please try again.");
      setResults([]);
      setResultsMeta(null);
      setSelectedProductId(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    const firstPage = 1;
    setPage(firstPage);
    await runSearchWithPage(firstPage);
  };

  const handleSearchWithQuery = async (value: string) => {
    const trimmed = value?.trim?.() ?? "";
    if (!trimmed) return;

    setQuery(trimmed);
    const firstPage = 1;
    setPage(firstPage);
    await runSearchWithPage(firstPage, trimmed);
  };

  const handleShowDeals = async () => {
    setMode("deals");
    setDealsError(null);
    setDealsLoading(true);

    try {
      const result = await fetchDeals(20);
      if (!result.ok) {
        setDeals([]);
        setDealsError(result.error ?? "Failed to load deals.");
      } else {
        const loadedDeals = result.deals ?? [];
        setDeals(loadedDeals);

        setResults([]);
        setResultsMeta((prev) => ({
          ...(prev ?? {}),
          productCount: loadedDeals.length,
          offerCount: undefined,
          page: 1,
          pageSize: loadedDeals.length || 0,
          pageCount: 1,
        }));

        setPage(1);
        setPageCount(1);
        setTotalProducts(loadedDeals.length);
        setSelectedProductId(null);
      }
    } finally {
      setDealsLoading(false);
    }
  };

  const handlePrevPage = async () => {
    if (page <= 1 || isSearching) return;
    const newPage = page - 1;
    setPage(newPage);
    await runSearchWithPage(newPage);
  };

  const handleNextPage = async () => {
    if (page >= pageCount || isSearching) return;
    const newPage = page + 1;
    setPage(newPage);
    await runSearchWithPage(newPage);
  };

  const handleToggleSaveProduct = (productId: string) => {
    setSavedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleToggleFavorite = async (productId: string) => {
    const isFavorite = favoriteProductIds.includes(productId);

    try {
      if (isFavorite) {
        setFavoriteProductIds((prev) =>
          prev.filter((id) => id !== productId),
        );

        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
      } else {
        setFavoriteProductIds((prev) => [...prev, productId]);

        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
      }
    } catch (error) {
      console.error("[favorites] toggle error:", error);
    } finally {
      void loadFavorites();
    }
  };

  const handleRunFavoriteSearch = async (product: FavoriteEntry["product"]) => {
    const nextQuery = product.displayName || product.name || "";
    if (!nextQuery) return;

    setQuery(nextQuery);

    await Promise.resolve().then(() => handleSearch());
  };

  function extractQueryFromMessage(raw: string): string {
    let text = raw.toLowerCase().trim();

    text = text.replace(/[!?.,]/g, " ");

    const leadingPhrases = [
      "best ",
      "find me ",
      "find ",
      "show me ",
      "show ",
      "search for ",
      "search ",
      "look for ",
      "look up ",
      "deals on ",
      "deal on ",
    ];

    for (const phrase of leadingPhrases) {
      if (text.startsWith(phrase)) {
        text = text.slice(phrase.length);
        break;
      }
    }

    const stopWords = ["for me", "please", "cheap", "cheapest", "deals", "deal"];
    for (const stop of stopWords) {
      text = text.replace(new RegExp(`\\b${stop}\\b`, "g"), " ");
    }

    text = text.replace(/\s+/g, " ").trim();

    return text;
  }

  const handleAssistantAsk = async (
    message: string,
  ): Promise<
    | { ok: false; error: string }
    | { ok: true; data: { products: any[]; meta: any } }
  > => {
    const cleaned = extractQueryFromMessage(message || "");
    const q = cleaned || message.trim();

    if (!q) {
      return {
        ok: false,
        error:
          "Please ask about a product, for example: 'best headphones' or 'coffee machine'.",
      };
    }

    try {
      const res = await fetch("/api/products/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          location: location ?? null,
          page: 1,
          pageSize: 5,
          sortBy: "default",
        }),
      });

      if (!res.ok) {
        return {
          ok: false,
          error: `Search failed with status ${res.status}`,
        };
      }

      const data = await res.json();
      return { ok: true, data };
    } catch (err) {
      console.error("[assistant] search error:", err);
      return {
        ok: false,
        error: "Search failed. Please try again.",
      };
    }
  };

  const handleSaveCurrentSearch = async () => {
    const trimmedQuery = query?.trim?.() ?? "";
    if (!trimmedQuery) {
      return;
    }

    const currentFilters = {
      location,
      sortBy,
      store: storeFilter,
      fastOnly,
    };

    try {
      setIsSavingSearch(true);
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmedQuery,
          filters: currentFilters,
        }),
      });

      const data = await res.json();

      if (data.ok && data.savedSearch) {
        setSavedSearches((prev) => [data.savedSearch as SavedSearch, ...prev]);
      }
    } catch (error) {
      console.error("[saved-searches] save error:", error);
    } finally {
      setIsSavingSearch(false);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));

      await fetch("/api/saved-searches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("[saved-searches] delete error:", error);
    }
  };

  const handleRunSavedSearch = async (saved: SavedSearch) => {
    setQuery(saved.query);

    const filters = (saved.filters ?? {}) as any;

    if (filters.location && typeof filters.location === "object") {
      setLocation(filters.location as SearchLocation);
    } else if (typeof filters.location === "string") {
      setLocation({ country: filters.location });
    }
    if (typeof filters.sortBy === "string") {
      setSortBy(filters.sortBy as SortBy);
    }
    if (typeof filters.store === "string") {
      setStoreFilter(filters.store);
    }
    if (typeof filters.fastOnly === "boolean") {
      setFastOnly(filters.fastOnly);
    }

    await Promise.resolve().then(() => handleSearch());
  };

  const handleSelectQueryFromInsights = async (selectedQuery: string) => {
    const trimmed = selectedQuery?.trim?.() ?? "";
    if (!trimmed) return;

    setQuery(trimmed);

    await Promise.resolve().then(() => handleSearch());
  };

  const showEnrichmentNoopNote =
    enrichmentMeta &&
    typeof enrichmentMeta.totalBefore === "number" &&
    typeof enrichmentMeta.totalAfter === "number" &&
    enrichmentMeta.totalAfter === enrichmentMeta.totalBefore &&
    Array.isArray(enrichmentMeta.providerCalls) &&
    enrichmentMeta.providerCalls.length > 0 &&
    enrichmentMeta.providerCalls.every(
      (p) => typeof p.ingestedCount === "number" && p.ingestedCount === 0,
    );

  return (
    <div className="pl-bg flex min-h-screen flex-col text-slate-900 dark:text-slate-50">
      <header className="border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex flex-col items-start gap-1 sm:items-center sm:text-center">
            <button
              type="button"
              className="rounded-full border border-[var(--pl-accent)] bg-[var(--pl-accent-soft)] px-6 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pl-accent)] shadow-sm transition hover:bg-[var(--pl-accent-soft)]/80 dark:border-[var(--pl-accent)] dark:bg-[var(--pl-accent-soft)] dark:text-[var(--pl-accent)]"
            >
              {appConfig.shortName}
            </button>
            <p className="mt-2 text-xs pl-text-main dark:text-slate-300">
              {appConfig.description}
            </p>
            <p className="mt-1 max-w-2xl text-xs pl-text-muted dark:text-slate-400">
              Real-time price comparison from live providers. If we can’t find it,
              we’ll tell you — no fake products, no demo data.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ThemeToggle />
            <AdBanner />
          </div>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-24 pt-3 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-6xl gap-4 lg:gap-6">
          {/* LEFT column: search + results */}
          <section className="flex flex-1 flex-col">
            {/* Search bar */}
            <section aria-label="Search products" className="space-y-2">
              <SearchBarAny
                query={query}
                onQueryChange={setQuery}
                onSearch={handleSearch}
                isSearching={isSearching}
                recentSearches={recentSearches}
                onSelectRecent={(value: string) => setQuery(value)}
              />

              <SearchDebugStrip enrichment={enrichmentMeta} />
            </section>

            {/* Filters + mode controls */}
            <section
              aria-label="Filters and view controls"
              className="mt-3 flex flex-wrap items-center justify-between gap-2 pl-card px-3 py-2 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                <LocationSelectorAny
                  location={location}
                  onUseMyLocation={handleUseMyLocation}
                  onLocationChange={handleLocationSelect}
                  isOpen={showLocationPanel}
                  setIsOpen={setShowLocationPanel}
                />
                <ResultControlsAny
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  storeFilter={storeFilter}
                  onStoreFilterChange={setStoreFilter}
                  fastOnly={fastOnly}
                  onFastOnlyChange={setFastOnly}
                  mode={mode}
                  onModeChange={setMode}
                  onShowDeals={handleShowDeals}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCurrentSearch}
                  disabled={isSavingSearch || !query.trim()}
                  className="pl-primary-btn px-3 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingSearch ? "Saving…" : "Save this search"}
                </button>
              </div>
            </section>

            {/* Main content: results or deals */}
            <section className="mt-3 flex flex-1 gap-3">
              <div className="pl-card flex flex-1 flex-col px-3 py-3 text-xs sm:text-sm">
                {mode === "deals" ? (
                  <div className="flex flex-1 flex-col">
                    {dealsLoading ? (
                      <div className="space-y-3 animate-pulse">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-16 w-full rounded-xl bg-slate-100 dark:bg-slate-800"
                          />
                        ))}
                      </div>
                    ) : dealsError ? (
                      <div className="text-center text-sm text-red-600">
                        {dealsError}
                      </div>
                    ) : deals.length === 0 ? (
                      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                        No deals available right now.
                      </div>
                    ) : (
                      <DealList deals={deals} />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col">
                    {isSearching ? (
                      <div
                        className="space-y-3 animate-pulse overflow-y-auto pr-1"
                        aria-live="polite"
                      >
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                          >
                            <div className="flex flex-1 flex-col gap-2">
                              <div className="h-3 w-48 rounded-full bg-slate-200" />
                              <div className="h-3 w-32 rounded-full bg-slate-200" />
                              <div className="h-3 w-40 rounded-full bg-slate-200" />
                            </div>
                            <div className="h-7 w-7 rounded-full bg-slate-200" />
                          </div>
                        ))}
                      </div>
                    ) : searchError ? (
                      <div className="text-center text-sm text-red-600">
                        <div className="font-medium">Couldn't load products.</div>
                        <div className="mt-1 text-red-500/80">
                          Please try again in a moment.
                        </div>
                      </div>
                    ) : !isSearching && query && results.length === 0 ? (
                      <div className="flex-1 overflow-y-auto pr-1">
                        <SearchEmptyState
                          query={query}
                          normalizedQuery={normalizedQuery}
                          isVague={isVague}
                          usedAlias={usedAlias}
                          onQuickSearch={(value) => {
                            void handleSearchWithQuery(value);
                          }}
                          dataStatus={resultsMeta?.dataStatus}
                          hadProviderTimeout={resultsMeta?.hadProviderTimeout}
                          hadProviderError={resultsMeta?.hadProviderError}
                        />
                      </div>
                    ) : (
                      <>
                        {/* Provider error banner - show when we have results but providers failed */}
                        {(resultsMeta?.hadProviderError || resultsMeta?.hadProviderTimeout) && results.length > 0 && (
                          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                            <span className="font-medium">
                              {resultsMeta?.hadProviderTimeout 
                                ? "Live providers are slow to respond." 
                                : "Live providers are temporarily unavailable."}
                            </span>{" "}
                            Showing cached results from our database.
                          </div>
                        )}
                        {/* Fallback query banner */}
                        {resultsMeta?.fallbackQueryUsed && (
                          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                            <span className="font-medium">No exact matches for &quot;{resultsMeta.originalQuery || query}&quot;.</span>{" "}
                            Showing results for &quot;{resultsMeta.fallbackQueryUsed}&quot; instead.
                          </div>
                        )}
                        <div className="flex-1 overflow-y-auto pr-1">
                          <ProductListAny
                            products={results}
                            selectedProductId={selectedProductId}
                            onSelectProduct={setSelectedProductId}
                            savedProductIds={savedProductIds}
                            onToggleSave={handleToggleSaveProduct}
                            favoriteProductIds={favoriteProductIds}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        </div>
                        {showEnrichmentNoopNote && (
                          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            Live providers didn’t find extra offers this time.
                            Results are from our existing catalog.
                          </div>
                        )}
                        {pageCount > 1 && (
                          <div className="mt-3 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                            <div>
                              Page{" "}
                              <span className="font-semibold">{page}</span> of{" "}
                              <span className="font-semibold">{pageCount}</span>
                              {totalProducts > 0 && (
                                <span className="ml-2 text-slate-500">
                                  · {totalProducts} result
                                  {totalProducts === 1 ? "" : "s"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handlePrevPage}
                                disabled={page <= 1 || isSearching}
                                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
                                aria-label="Previous page"
                              >
                                Prev
                              </button>
                              <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={page >= pageCount || isSearching}
                                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                                aria-label="Next page"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Compact right-hand column in main area: saved searches & insights */}
              <aside className="hidden w-64 shrink-0 flex-col gap-3 lg:flex">
                <section
                  className="pl-card px-3 py-3 text-xs"
                  aria-label="Saved searches"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      Saved searches
                    </h3>
                    {isLoadingSavedSearches && !savedSearchesError && (
                      <span className="text-[10px] text-slate-400">
                        Loading…
                      </span>
                    )}
                  </div>

                  {savedSearchesError ? (
                    <p className="text-[11px] text-red-600">
                      {savedSearchesError}
                    </p>
                  ) : savedSearches.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      No saved searches yet. Save a search to quickly rerun it
                      later.
                    </p>
                  ) : (
                    <ul className="max-h-48 space-y-1 overflow-y-auto" role="list">
                      {savedSearches.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-2 text-[11px] text-slate-700"
                        >
                          <button
                            type="button"
                            onClick={() => handleRunSavedSearch(s)}
                            className="flex-1 truncate text-left hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100"
                          >
                            {s.query}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSavedSearch(s.id)}
                            className="text-[10px] text-slate-400 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100"
                            aria-label="Delete saved search"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section
                  className="pl-card px-3 py-3 text-xs"
                  aria-label="Search insights"
                >
                  <SearchInsightsAny
                    onSelectQuery={handleSelectQueryFromInsights}
                  />
                </section>
              </aside>
            </section>
          </section>

          {/* RIGHT column: product summary + price trend + ads */}
          <aside className="hidden w-full max-w-sm flex-col gap-4 lg:flex">
            {/* Favorites panel */}
            <section
              className="pl-card px-4 py-3 text-xs"
              aria-label="Favorite products"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  My favorites
                </h3>
                {isLoadingFavorites && !favoritesError && (
                  <span className="text-[10px] text-slate-400">Loading…</span>
                )}
              </div>

              {isLoadingFavorites ? (
                <div className="space-y-2 animate-pulse">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-5 w-full rounded-md bg-slate-100"
                    />
                  ))}
                </div>
              ) : favoritesError ? (
                <p className="text-[11px] text-red-600">{favoritesError}</p>
              ) : favorites.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No favorites yet. Tap the ★ on a product to save it.
                </p>
              ) : (
                <ul className="max-h-56 space-y-1 overflow-y-auto" role="list">
                  {favorites.map((fav) => {
                    const p = fav.product;
                    const label = p.displayName || p.name;
                    const listings = Array.isArray(p.listings) ? p.listings : [];
                    const cheapestListing =
                      listings.length > 0
                        ? listings.reduce(
                            (min, l) => (l.price < min.price ? l : min),
                            listings[0],
                          )
                        : null;

                    return (
                      <li
                        key={fav.productId}
                        className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-200"
                      >
                        <button
                          type="button"
                          onClick={() => handleRunFavoriteSearch(p)}
                          className="flex-1 truncate text-left hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100"
                          aria-label={`Search again for ${label}`}
                        >
                          {label}
                          {p.brand ? (
                            <span className="ml-1 text-slate-500 dark:text-slate-400">
                              · {p.brand}
                            </span>
                          ) : null}
                          {cheapestListing ? (
                            <span className="ml-1 text-emerald-600 dark:text-emerald-300">
                              · {cheapestListing.price}{" "}
                              {cheapestListing.currency}
                            </span>
                          ) : null}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(p.id)}
                          className="ml-2 text-[12px] text-yellow-500 dark:text-yellow-400 hover:text-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100"
                          aria-label="Remove from favorites"
                        >
                          ★
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <ProductSummaryAny
              product={selectedProduct}
              selectedProductId={selectedProductId}
              totalProducts={resultsMeta?.productCount ?? results.length}
              totalOffers={resultsMeta?.offerCount ?? 0}
            />

            <PriceTrendChartAny
              history={selectedProduct?.priceHistory ?? []}
            />
            <AdSidebarBox />
          </aside>

          {/* FLOATING AI ASSISTANT BUTTON + PANEL (top-right) */}
          <button
            type="button"
            onClick={() => setShowAssistant((prev) => !prev)}
            className="fixed right-6 top-6 z-40 pl-primary-btn text-sm md:text-base"
            aria-label="Toggle AI assistant"
          >
            <span className="hidden sm:inline">AI Assistant</span>
            <span className="sm:hidden">AI</span>
          </button>

          {showAssistant && (
            <div className="fixed bottom-20 right-5 z-40 w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 shadow-[0_0_30px_rgba(15,23,42,0.25)] backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
              <ChatAssistantAny
                location={location}
                onClose={() => setShowAssistant(false)}
                onAsk={handleAssistantAsk}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}