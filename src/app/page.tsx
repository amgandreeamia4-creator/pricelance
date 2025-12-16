"use client";

import React, { useState, useEffect } from "react";

import ThemeToggle from "@/components/ThemeToggle";
import ProductList from "@/components/ProductList";
import ChatAssistant from "@/components/ChatAssistant";
import { CORE_CATEGORIES, CATEGORY_LABELS, STORES } from "@/config/catalog";
import PriceTrendChart from "@/components/PriceTrendChart";
import ProductSummary from "@/components/ProductSummary";

export default function Page() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Filters
  const [sortBy, setSortBy] = useState("default");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [fastOnly, setFastOnly] = useState(false);

  // Location
  const [location, setLocation] = useState("Not set");

  // Saved searches (mock)
  const [savedSearches] = useState([
    "laptop", "coffee", "coffee", "laptop", "nike", "honey", "coffee", "iphone", "samsung"
  ]);

  const [trendProductId, setTrendProductId] = useState<string | null>(null);
  const [trendHistory, setTrendHistory] = useState<
    { date: string; price: number; currency: string }[]
  >([]);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  useEffect(() => {
    if (!products || products.length === 0) {
      setTrendProductId(null);
      setTrendHistory([]);
      setTrendError(null);
      setIsTrendLoading(false);
      return;
    }

    const fallbackId = (products[0] as any)?.id ?? null;
    const targetId = selectedProductId ?? fallbackId;

    if (!targetId) {
      setTrendProductId(null);
      setTrendHistory([]);
      setTrendError(null);
      setIsTrendLoading(false);
      return;
    }

    setTrendProductId(targetId as string);
  }, [products, selectedProductId]);

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
    document.getElementById("ai-assistant-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Unified card style - single navy card background
  const cardStyle = "rounded-2xl bg-[var(--pl-card)] border border-[var(--pl-card-border)]";

  return (
    <div className="min-h-screen w-full">
      {/* ════════════════════════════════════════════════════════════════
          TOP HEADER SECTION
      ════════════════════════════════════════════════════════════════ */}
      <header className="relative w-full pt-6 pb-4 px-6">
        {/* Centered content */}
        <div className="max-w-5xl mx-auto text-center">
          {/* PRICELANCE badge */}
          <div className="inline-block px-5 py-1.5 rounded-full border border-[var(--pl-card-border)] bg-[var(--pl-card)] text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--pl-text)]">
            PRICELANCE
          </div>

          {/* Subtitle lines */}
          <p className="mt-3 text-[12px] text-[var(--pl-text-muted)] leading-relaxed">
            PriceLance helps you compare real prices across multiple providers, track genuine deals over time, and discover smarter ways to buy.
          </p>
          <p className="mt-1 text-[11px] text-[var(--pl-text-subtle)]">
            Real-time price comparison from live providers. If we can't find it, we'll tell you — no fake products, no demo data.
          </p>
        </div>

        {/* Right side controls - Light toggle + AI Assistant */}
        <div className="absolute right-6 top-6 flex items-center gap-3">
          {/* Light/Dark toggle capsule */}
          <ThemeToggle />

          {/* AI Assistant button with glow */}
          <button
            type="button"
            onClick={scrollToAssistant}
            className="px-4 py-2 rounded-full bg-[var(--pl-primary)] hover:brightness-110 text-[12px] font-medium text-white shadow-[0_0_20px_var(--pl-primary-glow)] transition-all"
          >
            AI Assistant
          </button>
        </div>

        {/* Ad slot preview label (top right, below buttons) */}
        <div className="absolute right-6 top-[72px] text-[9px] text-[var(--pl-text-subtle)]">
          <span className="px-2 py-1 rounded bg-[var(--pl-card)] border border-[var(--pl-card-border)]">
            Ad slot preview · Header banner 776x90
          </span>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          SEARCH BAR ROW
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full px-6 mt-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
                placeholder='Search products (e.g. "iphone 15", "nescafe", "dior sauvage")'
                className="w-full px-5 py-3 rounded-2xl bg-[var(--pl-card)] border border-[var(--pl-card-border)] text-[12px] text-[var(--pl-text)] placeholder:text-[var(--pl-text-subtle)] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_var(--pl-primary-glow)] transition-all"
              />
            </div>

            {/* Search button with blue glow */}
            <button
              onClick={() => runSearch(query)}
              disabled={isSearching}
              className="px-7 py-3 rounded-2xl bg-[var(--pl-primary)] hover:brightness-110 text-[12px] font-semibold text-white shadow-[0_0_20px_var(--pl-primary-glow)] disabled:opacity-50 transition-all"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Debug line */}
          <p className="mt-2 text-[10px] text-[var(--pl-text-subtle)] italic">
            Debug: no enrichment data for last search.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          THREE-COLUMN LAYOUT
      ════════════════════════════════════════════════════════════════ */}
      <main className="w-full px-6 mt-6 pb-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-5 items-start">

          {/* ═══════════════════════════════════════════════════════════
              LEFT COLUMN
          ═══════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-4">

            {/* YOUR LOCATION card */}
            <div className={`${cardStyle} p-4`}>
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
                onClick={handleUseLocation}
                className="mt-3 w-full py-2 rounded-lg bg-[var(--pl-primary)] hover:brightness-110 text-sm font-medium text-white shadow-[0_0_15px_var(--pl-primary-glow)] transition-all"
              >
                Use my location (stub)
              </button>
            </div>

            {/* FILTERS card */}
            <div className={`${cardStyle} p-4`}>
              <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-3">
                Filters
              </h3>
              <div className="flex flex-col gap-3">
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 w-10">Sort</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--pl-bg)] border border-[var(--pl-card-border)] text-[11px] text-[var(--pl-text)] focus:outline-none"
                  >
                    <option value="default">Default</option>
                    <option value="price_asc">Price ↑</option>
                    <option value="price_desc">Price ↓</option>
                  </select>
                </div>

                {/* Category */}
                <div className="flex items-center gap-2">
                  <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 w-10">Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--pl-bg)] border border-[var(--pl-card-border)] text-[11px] text-[var(--pl-text)] focus:outline-none"
                  >
                    <option value="all">All categories</option>
                    {CORE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Store */}
                <div className="flex items-center gap-2">
                  <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 w-10">Store</span>
                  <select
                    value={storeFilter}
                    onChange={(e) => setStoreFilter(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--pl-bg)] border border-[var(--pl-card-border)] text-[11px] text-[var(--pl-text)] focus:outline-none"
                  >
                    <option value="all">All stores</option>
                    {STORES.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fast shipping checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastOnly}
                    onChange={(e) => setFastOnly(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[var(--pl-card-border)] bg-[var(--pl-bg)] text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">Fast shipping only</span>
                </label>
              </div>
              <button
                disabled={!query.trim()}
                className="mt-3 w-full py-2.5 text-sm font-medium text-[var(--pl-text)] disabled:opacity-40 hover:brightness-110 transition-all"
              >
                Save this search
              </button>
            </div>

            {/* Sidebar ad preview (moved from right column) */}
            <div className={`${cardStyle} p-3`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200">Ad</span>
                <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200">Sidebar ad preview</span>
              </div>
              <div className="w-full h-[150px] rounded-lg bg-[var(--pl-bg)] border border-[var(--pl-card-border)] flex items-center justify-center">
                <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">300 × 250</span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              CENTER COLUMN
          ═══════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-4">

            {/* Results area */}
            <div className={`${cardStyle} p-5 min-h-[180px]`}>
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <h3 className="text-[13px] font-medium text-[var(--pl-text)] mb-1">
                    No results found
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    Try searching for a product above to see matching items.
                  </p>
                </div>
              ) : (
                <ProductList
                  products={products}
                  selectedProductId={selectedProductId}
                  onSelectProduct={(id: string) => setSelectedProductId(id)}
                />
              )}
            </div>

            {/* SAVED SEARCHES panel */}
            <div className={`${cardStyle} p-4`}>
              <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-2">
                Saved Searches
              </h3>
              <div className="max-h-[140px] overflow-y-auto pr-1 space-y-0.5">
                {savedSearches.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5 group">
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

            {/* MY FAVORITES (relocated from right column) */}
            <div className={`${cardStyle} p-4`}>
              <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                My Favorites
              </h3>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                No favorites yet. Tap the ★ on a product to save it.
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              RIGHT COLUMN
          ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-4 lg:space-y-5">

            <ProductSummary
              product={
                (selectedProductId
                  ? products.find((p: any) => p.id === selectedProductId) ?? null
                  : products.length > 0
                  ? (products[0] as any)
                  : null) as any
              }
              selectedProductId={selectedProductId}
              totalProducts={products.length}
              totalOffers={
                Array.isArray(products)
                  ? products.reduce((sum, p: any) => {
                      const listings = Array.isArray(p.listings) ? p.listings : [];
                      return sum + listings.length;
                    }, 0)
                  : 0
              }
            />

            <PriceTrendChart
              points={trendHistory}
              isLoading={isTrendLoading}
              error={trendError}
            />

            {/* AI ASSISTANT PANEL */}
            <div id="ai-assistant-panel">
              <ChatAssistant
                products={products}
                searchQuery={query}
                location={location}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
