"use client";

import React, { useState, useEffect, useMemo } from "react";

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
    "coffee",
    "coffee",
    "laptop",
    "nike",
    "honey",
    "coffee",
    "iphone",
    "samsung",
  ]);

  const [trendProductId, setTrendProductId] = useState<string | null>(null);
  const [trendHistory, setTrendHistory] = useState<
    { date: string; price: number; currency: string }[]
  >([]);
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
            setTrendError("No price history available yet for this product.");
          }
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        if (data?.ok && Array.isArray(data.points)) {
          setTrendHistory(data.points);
          setTrendError(null);
        } else {
          setTrendHistory([]);
          setTrendError("No price history available yet for this product.");
        }
      } catch (error) {
        console.error("Price history could not be loaded.", error);
        if (!cancelled) {
          setTrendHistory([]);
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
      setSelectedProductId(null);
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

  function scrollToAssistant() {
    document
      .getElementById("ai-assistant-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Unified card style
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
    <main className="min-h-screen w-full bg-[var(--pl-bg)] text-[var(--pl-text)]">
      {/* HEADER */}
      <header className="w-full px-6 py-4 border-b border-[var(--pl-card-border)] bg-[var(--pl-bg)]">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="text-lg font-bold tracking-[0.35em] uppercase">
            PRICELANCE
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              type="button"
              onClick={scrollToAssistant}
              className="px-4 py-2 rounded-full bg-[var(--pl-primary)] text-white text-xs font-medium shadow-[0_0_16px_var(--pl-primary-glow)] hover:brightness-110 transition-all"
            >
              AI Assistant
            </button>
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="w-full bg-[var(--pl-bg)] py-4 px-6 border-b border-[var(--pl-card-border)]">
        <div
          id="search"
          className="max-w-4xl mx-auto flex items-center gap-3"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
            placeholder='Search products (e.g. "laptop", "mouse", "nescafe")'
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--pl-card-border)] bg-[var(--pl-card)] text-sm text-[var(--pl-text)] placeholder:text-[var(--pl-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--pl-primary)] focus:border-[var(--pl-primary)] shadow-[0_0_12px_rgba(15,23,42,0.6)]"
          />
          <button
            type="button"
            onClick={() => runSearch(query)}
            disabled={isSearching}
            className="px-6 py-2.5 rounded-xl bg-[var(--pl-primary)] text-white text-sm font-semibold shadow-[0_0_20px_var(--pl-primary-glow)] hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <section className="w-full max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="md:col-span-3 space-y-6">
          {/* LOCATION */}
          <div className={`${cardStyle} p-4`}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--pl-text-subtle)] mb-3">
              Your location
            </h3>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[var(--pl-card-border)] bg-[var(--pl-bg)] text-[12px] text-[var(--pl-text)] focus:outline-none focus:border-[var(--pl-primary)]"
            >
              <option value="Not set">Not set</option>
              <option value="Romania">Romania</option>
              <option value="Germany">Germany</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
            <button
              type="button"
              onClick={handleUseLocation}
              className="mt-3 w-full py-2.5 rounded-lg bg-[var(--pl-primary)] text-[12px] font-medium text-white shadow-[0_0_15px_var(--pl-primary-glow)] hover:brightness-110 transition-all"
            >
              Use my location (stub)
            </button>
          </div>

          {/* FILTERS */}
          <div id="filters" className={`${cardStyle} p-4`}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--pl-text-subtle)] mb-3">
              Filters
            </h3>

            {/* Sort */}
            <div className="mb-3">
              <label className="block text-[11px] font-medium text-[var(--pl-text)] mb-1">
                Sort
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "relevance" | "price-asc" | "price-desc",
                  )
                }
                className="w-full p-2 rounded-lg border border-[var(--pl-card-border)] bg-[var(--pl-bg)] text-[12px] text-[var(--pl-text)] focus:outline-none focus:border-[var(--pl-primary)]"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
              </select>
            </div>

            {/* Store */}
            <div className="mb-3">
              <label className="block text-[11px] font-medium text-[var(--pl-text)] mb-1">
                Store
              </label>
              <select
                value={storeFilter}
                onChange={(e) =>
                  setStoreFilter(e.target.value as StoreId | "all")
                }
                className="w-full p-2 rounded-lg border border-[var(--pl-card-border)] bg-[var(--pl-bg)] text-[12px] text-[var(--pl-text)] focus:outline-none focus:border-[var(--pl-primary)]"
              >
                <option value="all">All stores</option>
                {STORES.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fast shipping */}
            <label className="flex items-center gap-2 text-[12px] cursor-pointer">
              <input
                type="checkbox"
                checked={fastOnly}
                onChange={(e) => setFastOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[var(--pl-card-border)] bg-[var(--pl-bg)] text-[var(--pl-primary)] focus:ring-[var(--pl-primary)]"
              />
              <span className="text-[var(--pl-text)]">Fast shipping only</span>
            </label>
          </div>
        </aside>

        {/* CENTER GRID */}
        <div className="md:col-span-6 space-y-6">
          {/* PRODUCT GRID */}
          <div className={`${cardStyle} p-4`}>
            {visibleProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <h3 className="text-[13px] font-medium text-[var(--pl-text)] mb-1">
                  No results found
                </h3>
                <p className="text-[11px] text-[var(--pl-text-subtle)]">
                  Try searching for a product above to see matching items.
                </p>
              </div>
            ) : (
              <ProductList
                products={visibleProducts}
                selectedProductId={selectedProductId}
                onSelectProduct={(id: string) => setSelectedProductId(id)}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </div>

          {/* You can re-add Saved Searches / Favorites UI here later if you want */}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="md:col-span-3 space-y-6">
          <ProductSummary
            product={activeProduct as any}
            selectedProductId={selectedProductId}
            totalProducts={totalProducts}
            totalOffers={totalOffers}
          />

          <PriceTrendChart
            points={trendHistory}
            isLoading={isTrendLoading}
            error={trendError}
          />

          <div id="ai-assistant-panel">
            <ChatAssistant
              products={visibleProducts}
              searchQuery={query}
              location={location}
              disabled={visibleProducts.length === 0}
            />
          </div>
        </aside>
      </section>

      {/* Affiliate Disclosure Footer */}
      <footer className="w-full px-6 py-4 border-t border-[var(--pl-card-border)] mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[10px] text-[var(--pl-text-subtle)] leading-relaxed">
            Some links on PriceLance are affiliate links. If you buy through one
            of these links, we may earn a small commission from the retailer, at
            no extra cost to you. Prices and availability can change; always
            check the retailer site.
          </p>
        </div>
      </footer>

      {/* BOTTOM NAV */}
      <footer className="w-full fixed bottom-0 left-0 border-t border-[var(--pl-card-border)] bg-[var(--pl-card)] py-2 px-6 flex justify-around text-[11px] z-50">
        <a
          href="#"
          className="text-[var(--pl-text-subtle)] hover:text-[var(--pl-primary)] transition-colors"
        >
          🏠 Home
        </a>
        <a
          href="#filters"
          className="text-[var(--pl-text-subtle)] hover:text-[var(--pl-primary)] transition-colors"
        >
          🎛️ Filters
        </a>
        <a
          href="#search"
          className="text-[var(--pl-text-subtle)] hover:text-[var(--pl-primary)] transition-colors"
        >
          🔍 Search
        </a>
        <a
          href="#"
          className="text-[var(--pl-text-subtle)] hover:text-[var(--pl-primary)] transition-colors"
        >
          🕘 Recent
        </a>
        <a
          href="#"
          className="text-[var(--pl-text-subtle)] hover:text-[var(--pl-primary)] transition-colors"
        >
          👤 Profile
        </a>
      </footer>
    </main>
  );
}