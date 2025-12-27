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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Filters
  const [sortBy, setSortBy] = useState<"relevance" | "price-asc" | "price-desc">("relevance");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<StoreId | "all">("all");
  const [fastOnly, setFastOnly] = useState(false);

  // Location
  const [location, setLocation] = useState("Not set");

  // Favorites (local)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Categories (from API – still used later)
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

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
    if (l.deliveryTimeDays != null) return l.deliveryTimeDays <= FAST_SHIPPING_DAYS;
    if (l.deliveryDays != null) return l.deliveryDays <= FAST_SHIPPING_DAYS;
    if (typeof l.fastDelivery === "boolean") return l.fastDelivery;
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
      if (id === "emag" || id === "altex" || id === "pcgarage" || id === "flanco") return 3;
      if (id === "other_eu" || id === "amazon_de") return 1;
    }
    if (isGermany) {
      if (id === "amazon_de" || id === "other_eu") return 2;
    }
    if (isUK) {
      if (id === "other_eu") return 1;
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
      visibleProducts.find((p) => p.id === selectedProductId) ?? visibleProducts[0];

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
      window.localStorage.setItem("pricelance:favorites", JSON.stringify(favoriteIds));
    } catch (error) {
      console.error("Failed to save favorites to localStorage", error);
    }
  }, [favoriteIds]);

  // Load dynamic categories (still used elsewhere)
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

      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (storeFilter !== "all") params.set("store", storeFilter);
      if (fastOnly) params.set("fastOnly", "true");

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

  const cardStyle =
    "rounded-2xl bg-[var(--pl-card)] border border-[var(--pl-card-border)] backdrop-blur-md shadow-[inset_0_0_0.5px_rgba(255,255,255,0.2),_0_4px_12px_rgba(0,0,0,0.08)]";

  const activeProduct =
    visibleProducts.find((p) => p.id === selectedProductId) ?? visibleProducts[0] ?? null;

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
    <main className="min-h-screen w-full text-[var(--pl-text)]" id="top">
      {/* HEADER CONTROLS */}
      <header className="w-full px-6 pt-6">
        <div className="max-w-7xl mx-auto flex justify-end items-center gap-4">
          <ThemeToggle />
          <button
            type="button"
            onClick={scrollToAssistant}
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[var(--pl-primary)] text-white text-xs font-medium shadow-[0_0_16px_var(--pl-primary-glow)] hover:brightness-110 transition-all"
          >
            AI Assistant
          </button>
        </div>
      </header>

      {/* SEARCH BAR */}
      <section className="w-full px-6 mt-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div
            id="search"
            className="flex-1 flex items-center h-12 rounded-full bg-[var(--pl-card)] border border-[var(--pl-card-border)] shadow-[0_20px_40px_rgba(15,23,42,0.22)] px-1 sm:px-2"
          >
            <div className="flex items-center">
              <div className="px-4 h-9 rounded-full bg-[var(--pl-primary)] text-white text-sm font-semibold flex items-center justify-center shadow-[0_0_16px_var(--pl-primary-glow)]">
                PriceLance
              </div>
            </div>

            <div className="flex items-center ml-2">
              <button
                type="button"
                className="h-8 px-3 rounded-full bg-[var(--pl-bg-soft)] text-[11px] font-medium text-[var(--pl-text)] flex items-center gap-1 border border-[var(--pl-card-border)]"
              >
                All
                <span className="text-[10px]">▾</span>
              </button>
            </div>

            <div className="mx-3 h-6 w-px bg-[var(--pl-card-border)]/80" />

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
              placeholder="Search for the best prices..."
              className="flex-1 bg-transparent text-sm text-[var(--pl-text)] placeholder:text-[var(--pl-text-subtle)] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => runSearch(query)}
            disabled={isSearching}
            className="h-11 px-6 rounded-full bg-[var(--pl-primary)] text-white text-sm font-semibold shadow-[0_0_18px_var(--pl-primary-glow)] hover:brightness-110 disabled:opacity-60 transition-all flex itemsCenter gap-2"
          >
            <span className="text-base">🔍</span>
            <span>{isSearching ? "Searching..." : "Search"}</span>
          </button>
        </div>
      </section>

      {/* MAIN GRID – 3 columns, full width with breathing room */}
      <section
        className="
          w-screen max-w-[1600px] mx-auto px-6 pt-6 pb-10
          grid grid-cols-1
          lg:grid-cols-[250px_minmax(0,_1fr)_300px]
          gap-8
        "
      >
        {/* LEFT SIDEBAR */}
        <aside className="space-y-5">
          <div className={`${cardStyle} px-4 py-5`}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--pl-text-subtle)] mb-3">
              Your location
            </h3>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[var(--pl-card-border)] bg-[var(--pl-bg-soft)] text-[12px] text-[var(--pl-text)] focus:outline-none focus:border-[var(--pl-primary)]"
            >
              <option value="Not set">Not set</option>
              <option value="Romania">Romania</option>
              <option value="Germany">Germany</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
            <button
              type="button"
              onClick={handleUseLocation}
              className="mt-3 w-full h-11 px-5 rounded-full bg-[var(--pl-primary)] text-[12px] font-medium text-white shadow-[0_0_16px_var(--pl-primary-glow)] hover:brightness-110 transition-all"
            >
              Use my location (stub)
            </button>
          </div>

          <div id="filters" className={`${cardStyle} px-4 py-5`}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--pl-text-subtle)] mb-3">
              Filters
            </h3>

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
                className="w-full p-2 rounded-lg border border-[var(--pl-card-border)] bg-[var(--pl-bg-soft)] text-[12px] text-[var(--pl-text)] focus:outline-none focus:border-[var(--pl-primary)]"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-[11px] font-medium text-[var(--pl-text)] mb-1">
                Store
              </label>
              <select
                value={storeFilter}
                onChange={(e) =>
                  setStoreFilter(e.target.value as StoreId | "all")
                }
                className="w-full p-2 rounded-lg border border-[var(--pl-card-border)] bg-[var(--pl-bg-soft)] text-[12px] text-[var(--pl-text)] focus:outline-none focus:border-[var(--pl-primary)]"
              >
                <option value="all">All stores</option>
                {STORES.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-[12px] cursor-pointer">
              <input
                type="checkbox"
                checked={fastOnly}
                onChange={(e) => setFastOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[var(--pl-card-border)] bg-[var(--pl-bg-soft)] text-[var(--pl-primary)] focus:ring-[var(--pl-primary)]"
              />
              <span className="text-[var(--pl-text)]">Fast shipping only</span>
            </label>
          </div>
        </aside>

        {/* CENTER COLUMN – wrapper widened with p-6 w-full */}
        <div className="space-y-5">
          <div className={`${cardStyle} p-6 w-full`}>
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
        </div>

        {/* RIGHT SIDEBAR */}
        <aside>
          <div className={`${cardStyle} px-4 py-5 space-y-5`}>
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

            <div
              id="ai-assistant-panel"
              className="animate-fade-in-up shadow-[0_0_12px_rgba(59,130,246,0.25)]"
            >
              <ChatAssistant
                products={visibleProducts}
                searchQuery={query}
                location={location}
                disabled={visibleProducts.length === 0}
              />
            </div>
          </div>
        </aside>
      </section>

      {/* Affiliate Disclosure Footer */}
      <footer className="w-full px-6 py-4 mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[10px] text-[var(--pl-text-subtle)] leading-relaxed">
            Some links on PriceLance are affiliate links. If you buy through one
            of these links, we may earn a small commission from the retailer, at
            no extra cost to you. Prices and availability can change; always
            check the retailer site.
          </p>
        </div>
      </footer>

      {/* Bottom nav */}
      <footer className="w-full fixed bottom-0 left-0 h-16 border-t border-[var(--pl-card-border)] bg-[var(--pl-card)]/80 backdrop-blur-xl px-6 flex items-center justify-center gap-8 text-[11px] z-50">
        <a
          href="#top"
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs text-[var(--pl-text-muted)] hover:text-[var(--pl-primary)] transition-colors"
        >
          <span className="text-[20px]">🏠</span>
          <span>Home</span>
        </a>
        <a
          href="#search"
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs text-[var(--pl-text-muted)] hover:text-[var(--pl-primary)] transition-colors"
        >
          <span className="text-[20px]">🔍</span>
          <span>Search</span>
        </a>
        <a
          href="#"
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs text-[var(--pl-text-muted)] hover:text-[var(--pl-primary)] transition-colors"
        >
          <span className="text-[20px]">🕘</span>
          <span>Recent</span>
        </a>
      </footer>
    </main>
  );
}