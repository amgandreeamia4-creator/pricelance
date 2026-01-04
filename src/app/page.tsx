"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useSpring, animated, config } from '@react-spring/web';

import ThemeToggle from "@/components/ThemeToggle";
import ProductList from "@/components/ProductList";
import ChatAssistant from "@/components/ChatAssistant";
import { STORES, StoreId } from "@/config/catalog";
import PriceTrendChart from "@/components/PriceTrendChart";
import ProductSummary from "@/components/ProductSummary";

type Listing = {
  id: string;
  storeId?: StoreId | string;
  storeName: string;
  storeLogoUrl?: string | null;
  price: number;
  currency: string;
  url?: string | null;
  fastDelivery?: boolean | null;
  deliveryDays?: number | null;
  inStock?: boolean | null;
  deliveryTimeDays?: number | null;

  // New: affiliate metadata from API
  source?: string | null;
  affiliateProvider?: string | null;
};

type ProductWithListings = {
  id: string;
  name: string;
  displayName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  listings: Listing[];
};

const FAST_SHIPPING_DAYS = 3;

export default function Page() {
  // Mobile collapsible states
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);
  const [adPreviewOpen, setAdPreviewOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductWithListings[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProductId, setSelectedProductId] =
    useState<string | null>(null);

  // Filters
  const [sortBy, setSortBy] = useState<
    "relevance" | "price-asc" | "price-desc"
  >("relevance");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<StoreId | "all">("all");
  const [fastOnly, setFastOnly] = useState(false);

  // Location
  const [location, setLocation] = useState("Not set");

  // Favorites (local only for now)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Dynamic categories from DB
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Saved searches (mock)
  const [savedSearches] = useState([
    "laptop",
    "monitor", 
    "telefon",
    "casti",
    "tastatura",
    "mouse",
  ]);

  const [trendProductId, setTrendProductId] = useState<string | null>(null);
  const [trendHistory, setTrendHistory] = useState<
    { date: string; price: number; currency: string; storeName?: string; isSynthetic?: boolean }[]
  >([]);
  const [trendTrend, setTrendTrend] = useState<{
    direction: 'up' | 'down' | 'flat' | 'none';
    percentChange?: number;
    startPrice?: number;
    endPrice?: number;
    firstDate?: string;
    lastDate?: string;
    numPoints: number;
  } | undefined>(undefined);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  function isFastListing(l: Listing): boolean {
    // Prefer explicit numeric days if present
    if (l.deliveryTimeDays != null) {
      return l.deliveryTimeDays <= FAST_SHIPPING_DAYS;
    }

    // Fallback: use deliveryDays if that's what the data uses
    if (l.deliveryDays != null) {
      return l.deliveryDays <= FAST_SHIPPING_DAYS;
    }

    // Fallback: a boolean hint
    if (typeof l.fastDelivery === "boolean") {
      return l.fastDelivery;
    }

    // If we know nothing, don't treat it as fast
    return false;
  }

  function getStorePreferenceScore(
    storeId: StoreId | string | undefined,
    location: string,
  ): number {
    if (!storeId) return 0;

    const loc = location.toLowerCase();
    const id = String(storeId).toLowerCase();

    const isRomania = loc.includes("romania") || loc === "ro";
    const isGermany = loc.includes("germany") || loc === "de";
    const isUK = loc.includes("united kingdom") || loc === "uk";

    if (isRomania) {
      if (id === "emag" || id === "altex" || id === "pcgarage" || id === "flanco") {
        return 3;
      }
      if (id === "other_eu" || id === "amazon_de") {
        return 1;
      }
    }

    if (isGermany) {
      if (id === "amazon_de" || id === "other_eu") {
        return 2;
      }
    }

    if (isUK) {
      if (id === "other_eu") {
        return 1;
      }
    }

    return 0;
  }

  const visibleProducts = useMemo(() => {
    let result = products.map((p) => ({
      ...p,
      listings: [...p.listings],
    }));

    if (storeFilter !== "all") {
      result = result
        .map((p) => ({
          ...p,
          listings: p.listings.filter((l) => l.storeId === storeFilter),
        }))
        .filter((p) => p.listings.length > 0);
    }

    if (fastOnly) {
      result = result
        .map((p) => ({
          ...p,
          listings: p.listings.filter((l) => isFastListing(l)),
        }))
        .filter((p) => p.listings.length > 0);
    }

    const getMinPrice = (p: (typeof result)[number]): number => {
      if (!p.listings.length) return Number.POSITIVE_INFINITY;
      return p.listings.reduce(
        (min, l) => (l.price < min ? l.price : min),
        Number.POSITIVE_INFINITY,
      );
    };

    const getBestStoreScore = (p: (typeof result)[number]): number => {
      if (!p.listings.length) return 0;
      let best = 0;
      for (const l of p.listings) {
        const score = getStorePreferenceScore(l.storeId as any, location);
        if (score > best) best = score;
      }
      return best;
    };

    if (sortBy === "price-asc" || sortBy === "price-desc") {
      result = [...result].sort((a, b) => {
        const aMin = getMinPrice(a);
        const bMin = getMinPrice(b);

        const aHas = Number.isFinite(aMin);
        const bHas = Number.isFinite(bMin);

        if (!aHas && !bHas) return 0;
        if (!aHas) return 1;
        if (!bHas) return -1;

        const base = sortBy === "price-asc" ? aMin - bMin : bMin - aMin;
        if (base !== 0) return base;

        const aScore = getBestStoreScore(a);
        const bScore = getBestStoreScore(b);
        return bScore - aScore;
      });
    }

    return result;
  }, [products, storeFilter, fastOnly, sortBy, location]);

  useEffect(() => {
    if (!selectedProductId) return;

    const stillThere = visibleProducts.some((p) => p.id === selectedProductId);
    if (!stillThere) {
      if (visibleProducts.length > 0) {
        setSelectedProductId(visibleProducts[0].id);
      } else {
        setSelectedProductId(null);
      }
    }
  }, [visibleProducts, selectedProductId]);

  useEffect(() => {
    if (!visibleProducts.length) {
      setTrendProductId(null);
      setTrendHistory([]);
      setTrendTrend(undefined);
      setTrendError(null);
      setIsTrendLoading(false);
      return;
    }

    const base =
      visibleProducts.find((p) => p.id === selectedProductId) ??
      visibleProducts[0];

    setTrendProductId(base.id);
  }, [visibleProducts, selectedProductId]);

  useEffect(() => {
    if (!trendProductId) {
      setTrendHistory([]);
      setTrendError(null);
      setIsTrendLoading(false);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setIsTrendLoading(true);
      try {
        const params = new URLSearchParams({ productId: trendProductId });
        const res = await fetch(`/api/price-history?${params.toString()}`, {
          method: "GET",
        });

        if (!res.ok) {
          console.error("Price history request failed", res.status);
          if (!cancelled) {
            setTrendHistory([]);
            setTrendTrend(undefined);
            setTrendError("No price history available yet for this product.");
          }
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        if (data?.ok && Array.isArray(data.points)) {
          setTrendHistory(data.points);
          setTrendTrend(data.trend || undefined);
          setTrendError(null);
        } else {
          setTrendHistory([]);
          setTrendTrend(undefined);
          setTrendError("No price history available yet for this product.");
        }
      } catch (error) {
        console.error("Price history could not be loaded.", error);
        if (!cancelled) {
          setTrendHistory([]);
          setTrendTrend(undefined);
          setTrendError("Price history could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setIsTrendLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [trendProductId]);

  // favorites: load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("pricelance:favorites");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setFavoriteIds(parsed.filter((id) => typeof id === "string"));
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage", error);
    }
  }, []);

  // favorites: persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "pricelance:favorites",
        JSON.stringify(favoriteIds),
      );
    } catch (error) {
      console.error("Failed to save favorites to localStorage", error);
    }
  }, [favoriteIds]);

  // Load dynamic categories from DB on mount
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setIsCategoriesLoading(true);
      setCategoriesError(null);

      try {
        const res = await fetch("/api/categories", { method: "GET" });

        if (cancelled) return;

        if (!res.ok) {
          console.error("Failed to load categories:", res.status);
          setCategories([]);
          setCategoriesError("Could not load categories.");
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
          setCategoriesError(null);
        } else {
          setCategories([]);
          setCategoriesError("Could not load categories.");
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        if (!cancelled) {
          setCategories([]);
          setCategoriesError("Could not load categories.");
        }
      } finally {
        if (!cancelled) {
          setIsCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFavorite = (productId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  // Resilient search function backed by /api/products
  async function runSearch(q: string) {
    const trimmed = q.trim();
    setQuery(trimmed);

    if (!trimmed) {
      setProducts([]);
      setSelectedProductId(null);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({ q: trimmed });

      if (categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }
      if (storeFilter !== "all") {
        params.set("store", storeFilter);
      }
      if (fastOnly) {
        params.set("fastOnly", "true");
      }

      const res = await fetch(`/api/products?${params.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        console.error("Search failed", res.status);
        setProducts([]);
        return;
      }

      const data = await res.json();
      const nextProducts = Array.isArray(data.products) ? data.products : [];
      setProducts(nextProducts);
      
      // Auto-select first product if no product is currently selected
      if (nextProducts.length > 0 && !selectedProductId) {
        setSelectedProductId(nextProducts[0].id);
      }
    } catch (error) {
      console.error("Search error in page.tsx", error);
      setProducts([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleUseLocation() {
    setLocation("Detecting...");
    setTimeout(() => setLocation("Romania"), 800);
  }

  function handleQuickPick(term: string) {
    runSearch(term);
  }

  function scrollToAssistant() {
    document
      .getElementById("ai-assistant-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Unified card style - single navy card background
  const cardStyle =
    "rounded-2xl bg-[var(--pl-card)] border border-[var(--pl-card-border)]";

  const activeProduct =
    visibleProducts.find((p) => p.id === selectedProductId) ??
    visibleProducts[0] ??
    null;

  const totalProducts = visibleProducts.length;
  const totalOffers = visibleProducts.reduce(
    (sum, p) => sum + p.listings.length,
    0,
  );

  const favoriteProducts = visibleProducts.filter((p) =>
    favoriteIds.includes(p.id),
  );

  const favoriteRows = favoriteProducts.flatMap((p) =>
    (p.listings ?? []).map((l) => ({
      key: `${p.id}-${l.id}`,
      productName: p.displayName || p.name,
      price: l.price,
      currency: l.currency,
      storeName: l.storeName,
    })),
  );

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50 dark:bg-noise-soft">
      {/* HEADER */}
      <header className="relative w-full pt-2 md:pt-4 pb-2 md:pb-3 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-2 md:gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* left side: PRICELANCE + theme toggle */}
            <div className="inline-flex items-center gap-2">
              <div className="inline-block px-3 py-1 md:px-5 md:py-1.5 rounded-full border border-[var(--pl-card-border)] bg-[var(--pl-card)] text-[10px] md:text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--pl-text)]">
                PRICELANCE
              </div>
              <ThemeToggle />
            </div>

            {/* right side: AI Assistant button - hidden on mobile */}
            <motion.button
              type="button"
              onClick={scrollToAssistant}
              className="hidden md:flex w-full sm:w-auto px-4 py-2 rounded-full bg-[var(--pl-primary)] hover:brightness-110 text-[12px] font-medium text-white shadow-[0_0_20px_var(--pl-primary-glow)] transition-all"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              AI Assistant (Beta)
            </motion.button>
          </div>

          {/* Desktop-only header ad slot preview */}
          <div className="hidden md:flex justify-end mt-2 md:mt-4">
            <div className="rounded-full border border-[var(--pl-card-border)] bg-[var(--pl-card)] px-3 py-1 text-[9px] text-[var(--pl-text-subtle)] whitespace-nowrap">
              Ad slot preview · Header banner 776x90
            </div>
          </div>

          {/* Long description – desktop only */}
          <div className="hidden md:block text-center mt-1 md:mt-2 sm:mt-3">
            <p className="text-[11px] sm:text-[12px] text-[var(--pl-text-muted)] leading-relaxed">
              PriceLance is an informational service that compares tech prices
              from multiple online retailers. Prices come from manually curated
              data, official feeds, and affiliate feeds where available — no
              scraping.
            </p>
            <p className="mt-1 sm:mt-2 max-w-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              PriceLance este un comparator independent de prețuri pentru electronice în România. Caută un produs, vezi ofertele din mai multe magazine online și alege rapid varianta care ți se potrivește.
            </p>
            <p className="mt-1 text-[11px] text-[var(--pl-text-subtle)]">
              Coverage is continuously expanding, starting from Romania and
              extending deeper into the EU. Always verify the final price,
              delivery costs, and product details on the retailer&apos;s website
              before buying.
            </p>
          </div>

          {/* Short description – mobile only */}
          <p className="mt-2 md:mt-3 hidden md:block text-sm leading-relaxed text-slate-200/90 text-center">
            Compare tech prices from multiple online stores and quickly see offers that fit your budget.
          </p>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="w-full px-6 mt-1 md:mt-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
                placeholder='Search products (e.g. "laptop gaming", "monitor 27", "iPhone 15")'
                className="w-full px-5 py-3 rounded-2xl bg-[var(--pl-card)] border border-[var(--pl-card-border)] text-[12px] text-[var(--pl-text)] placeholder:text-[var(--pl-text-subtle)] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_var(--pl-primary-glow)] transition-all"
              />
            </div>
            <button
              onClick={() => runSearch(query)}
              disabled={isSearching}
              className="px-7 py-3 rounded-2xl bg-[var(--pl-primary)] hover:brightness-110 text-[12px] font-semibold text-white shadow-[0_0_20px_var(--pl-primary-glow)] disabled:opacity-50 transition-all"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
          {process.env.NODE_ENV !== 'production' && (
  <p className="mt-2 text-[10px] text-[var(--pl-text-subtle)]">
    Debug: no enrichment data for last search.
  </p>
)}
        </div>
      </div>

      {/* QUICK PICKS - Mobile only */}
      <div className="w-full px-6 mt-2 md:mt-3 md:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {savedSearches.slice(0, 5).map((term) => (
              <button
                key={term}
                type="button"
                className="rounded-full border border-[var(--pl-card-border)] px-3 py-1 text-xs font-medium text-[var(--pl-text)] bg-[var(--pl-card)]/80 hover:bg-[var(--pl-card)] shadow-sm transition-all"
                onClick={() => handleQuickPick(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* THREE-COLUMN LAYOUT */}
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-6 xl:px-8 mt-4 sm:mt-6 pb-4 sm:pb-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[260px,minmax(0,1fr),320px] items-start">
          {/* LEFT COLUMN - Mobile order 6 (secondary sections) */}
          <div className="flex flex-col gap-4 order-6 lg:order-1">
            {/* LOCATION */}
            <div className={`${cardStyle} p-3 sm:p-4`}>
              <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-3">
                Your Location
              </h3>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--pl-bg)] border border-[var(--pl-card-border)] text-[12px] text-[var(--pl-text)] focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="Not set">Not set</option>
                <option value="Romania">Romania</option>
                <option value="United States">United States</option>
                <option value="Germany">Germany</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
              <button
                disabled
                className="mt-3 w-full py-2 rounded-lg bg-[var(--pl-primary)] text-sm font-medium text-white shadow-[0_0_15px_var(--pl-primary-glow)] opacity-50 cursor-not-allowed transition-all"
              >
                Use my location
              </button>
              <p className="mt-2 text-[10px] text-[var(--pl-text-subtle)] text-center">
                Location-based results coming soon.
              </p>
            </div>

            {/* FILTERS */}
            <div className={`${cardStyle} p-3 sm:p-4 overflow-x-hidden`}>
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-3">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
              </div>
              <div className="flex flex-col gap-3">
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 w-10">
                    Sort
                  </span>
                  <div className="flex-1 min-w-0">
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as
                            | "relevance"
                            | "price-asc"
                            | "price-desc",
                        )
                      }
                      className="w-full max-w-full px-2 py-1.5 rounded-lg bg-[var(--pl-bg)] border border-[var(--pl-card-border)] text-[11px] text-[var(--pl-text)] truncate overflow-hidden text-ellipsis focus:outline-none"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-asc">Price ↑</option>
                      <option value="price-desc">Price ↓</option>
                    </select>
                  </div>
                </div>

                {/* Category (temporarily hidden to avoid layout bugs; keep logic for later) */}
                {false && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 w-10">
                      Category
                    </span>
                    <div className="flex-1 min-w-0">
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full max-w-full px-2 py-1.5 rounded-lg bg-[var(--pl-bg)] border border-[var(--pl-card-border)] text-[11px] text-[var(--pl-text)] truncate overflow-hidden text-ellipsis focus:outline-none"
                      >
                        <option value="all">All categories</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Store */}
                <div className="flex items-center gap-2">
                  <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 w-10">
                    Store
                  </span>
                  <div className="flex-1 min-w-0">
                    <select
                      value={storeFilter}
                      onChange={(e) =>
                        setStoreFilter(e.target.value as StoreId | "all")
                      }
                      className="w-full max-w-full px-2 py-1.5 rounded-lg bg-[var(--pl-bg)] border border-[var(--pl-card-border)] text-[11px] text-[var(--pl-text)] truncate overflow-hidden text-ellipsis focus:outline-none"
                    >
                      <option value="all">All stores</option>
                      {STORES.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fast shipping */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastOnly}
                    onChange={(e) => setFastOnly(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[var(--pl-card-border)] bg-[var(--pl-bg)] text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    Fast shipping only
                  </span>
                </label>
              </div>
              <button
                disabled={!query.trim()}
                className="mt-3 w-full py-2.5 text-sm font-medium text-[var(--pl-text)] disabled:opacity-40 hover:brightness-110 transition-all"
              >
                Save this search
              </button>
            </div>

            {/* Sidebar ad preview - hidden on mobile */}
            <div className={`${cardStyle} overflow-hidden hidden md:block`}>
              {/* Mobile collapsible header */}
              <div 
                className="sm:hidden flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--pl-bg)]/50 transition-colors"
                onClick={() => setAdPreviewOpen(!adPreviewOpen)}
              >
                <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200">
                  Ad
                </span>
                {adPreviewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              
              {/* Desktop always-visible header */}
              <div className="hidden sm:flex items-center justify-between mb-1.5 p-4 pt-0">
                <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200">
                  Ad
                </span>
                <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200">
                  Preview
                </span>
              </div>
              
              {/* Collapsible content */}
              <div className={`${adPreviewOpen ? 'block' : 'hidden'} sm:block p-3 sm:p-4 pt-0 sm:pt-0`}>
                <div className="flex items-center justify-center h-32 sm:h-40 w-full border-2 border-dashed border-[var(--pl-card-border)] rounded-lg bg-[var(--pl-bg)]/50">
                  <span className="text-[10px] text-[var(--pl-text-subtle)]">300×250</span>
                </div>
              </div>
            </div>

            {/* Favorites */}
            <div className={`${cardStyle} p-3 sm:p-4 hidden md:block`}>
              <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                My Favorites
              </h3>
              {favoriteRows.length === 0 ? (
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  No favorites yet. Tap the ★ on a product to save it.
                </p>
              ) : (
                <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1">
                  {favoriteRows.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between text-xs py-0.5"
                    >
                      <span className="line-clamp-1 text-[var(--pl-text)]">
                        {row.productName}
                      </span>
                      <span className="ml-2 text-[10px] text-[var(--pl-text-subtle)]">
                        {row.price != null
                          ? `${row.price} ${row.currency ?? ""}`
                          : "No price"}
                        {row.storeName ? ` · ${row.storeName}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CENTER COLUMN - Mobile order 3 (results area) */}
          <div className="flex flex-col gap-4 order-3 lg:order-2">
            {/* Only show results card when there are products to display */}
            {visibleProducts.length > 0 && (
              <div className={`${cardStyle} px-6 py-5`}>
                <ProductList
                  products={visibleProducts}
                  selectedProductId={selectedProductId}
                  onSelectProduct={(id: string) => setSelectedProductId(id)}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                  isLoading={isSearching}
                />
              </div>
            )}

            {/* Saved searches - collapsible on mobile */}
            <div className={`${cardStyle} overflow-hidden`}>
              {/* Mobile collapsible header */}
              <div 
                className="sm:hidden flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--pl-bg)]/50 transition-colors"
                onClick={() => setSavedSearchesOpen(!savedSearchesOpen)}
              >
                <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200">
                  Saved Searches
                </span>
                {savedSearchesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              
              {/* Desktop always-visible header */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-3 p-4 pt-0">
                <span>Saved Searches</span>
              </div>
              
              {/* Collapsible content */}
              <div className={`${savedSearchesOpen ? 'block' : 'hidden'} sm:block p-3 sm:p-4 pt-0 sm:pt-0`}>
              <div className="max-h-[140px] overflow-y-auto pr-1 space-y-0.5">
                {savedSearches.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-0.5 group"
                  >
                    <span
                      onClick={() => runSearch(s)}
                      className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
                    >
                      {s}
                    </span>
                    <button className="text-[10px] text-[var(--pl-text-subtle)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </button>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Mobile order 4-5 (best options + price trend) */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-5 order-4 lg:order-3">
            {/* Product Summary - hidden on mobile */}
            <div className="order-4 lg:order-1 hidden md:block">
              <ProductSummary
                product={activeProduct as any}
                selectedProductId={selectedProductId}
                totalProducts={totalProducts}
                totalOffers={totalOffers}
              />
            </div>

            {/* Price Trend - hidden on mobile */}
            <div className="order-5 lg:order-2 hidden md:block">
              <div className="p-4 text-sm sm:p-6 sm:text-base">
                <PriceTrendChart
                  points={trendHistory}
                  trend={trendTrend}
                  isLoading={isTrendLoading}
                  error={trendError}
                  hasProductSelected={!!selectedProductId}
                />
              </div>
            </div>

            {/* Assistant - hidden on mobile */}
            <div className="order-6 lg:order-3 hidden md:block">
              {(visibleProducts.length > 0 || !products.length) && (
              <div className={`${cardStyle} overflow-hidden`}>
                {/* Desktop always-visible content */}
                <div className="block">
                  <div id="ai-assistant-panel">
                    <ChatAssistant
                      products={visibleProducts}
                      searchQuery={query}
                      location={location}
                      disabled={visibleProducts.length === 0}
                    />
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Disclosure Footer */}
      <footer className="w-full px-6 py-4 border-t border-[var(--pl-card-border)]">
  <div className="max-w-7xl mx-auto text-center">
          <p className="text-[10px] text-[var(--pl-text-subtle)] leading-relaxed">
            Some links on PriceLance are affiliate links. If you buy through one
            of these links, we may earn a small commission from the retailer, at
            no extra cost to you. Prices and availability can change; always
            check the retailer site.
          </p>
        </div>
      </footer>
    </main>
  );
}
