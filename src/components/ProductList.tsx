"use client";

import React from "react";

type Listing = {
  id: string;
  storeName: string;
  price: number;
  currency: string;
  inStock?: boolean | null;
  fastDelivery?: boolean | null;
};

type ProductWithListings = {
  id: string;
  name: string;
  displayName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  listings: Listing[];
};

type ProductListProps = {
  products: ProductWithListings[];
  selectedProductId: string | null;
  onSelectProduct: (id: string) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
};

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function pickBestListing(listings: Listing[] | undefined | null): Listing | null {
  if (!listings || listings.length === 0) return null;

  const scored = listings
    .filter((l) => !!l)
    .map((l) => ({
      l,
      inStockScore: l.inStock == null ? 0 : l.inStock ? 1 : -1,
      price: typeof l.price === "number" ? l.price : Number.POSITIVE_INFINITY,
    }));

  scored.sort((a, b) => {
    if (b.inStockScore !== a.inStockScore) return b.inStockScore - a.inStockScore;
    return a.price - b.price;
  });

  return scored[0]?.l ?? null;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.5a.6.6 0 011.04 0l2.47 4.99a.6.6 0 00.45.33l5.51.8a.6.6 0 01.33 1.02l-3.99 3.89a.6.6 0 00-.17.53l.94 5.49a.6.6 0 01-.87.63l-4.93-2.59a.6.6 0 00-.56 0l-4.93 2.59a.6.6 0 01-.87-.63l.94-5.49a.6.6 0 00-.17-.53L2.72 10.64a.6.6 0 01.33-1.02l5.51-.8a.6.6 0 00.45-.33l2.47-4.99z"
      />
    </svg>
  );
}

export default function ProductList({
  products,
  selectedProductId,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
}: ProductListProps) {
  if (!products || products.length === 0) return null;

  return (
    <div
      className={[
        "w-full",
        "grid gap-4 sm:gap-5",
        // Enforce minimum card width so they never become skinny sticks.
        "[grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]",
        // Slightly wider min on very large screens, effectively capping columns.
        "2xl:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]",
      ].join(" ")}
    >
      {products.map((product) => {
        const isSelected = selectedProductId === product.id;
        const isFavorite = favoriteIds.includes(product.id);

        const best = pickBestListing(product.listings);
        const bestPrice =
          best?.price != null && best?.currency
            ? formatMoney(best.price, best.currency)
            : null;
        const bestStore = best?.storeName ?? null;

        return (
          <div
            key={product.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectProduct(product.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectProduct(product.id);
              }
            }}
            className={[
              "relative flex h-full flex-col",
              "rounded-2xl border",
              "bg-[var(--pl-card)] border-[var(--pl-card-border)]",
              "px-4 py-4",
              "shadow-sm transition-shadow",
              "hover:shadow-md hover:-translate-y-1",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-primary)]",
              isSelected ? "ring-2 ring-[var(--pl-primary)]" : "",
            ].join(" ")}
          >
            {/* Single favorite star (top-right) */}
            <button
              type="button"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={isFavorite}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              className={[
                "absolute right-3 top-3 z-10",
                "grid h-9 w-9 place-items-center rounded-full",
                "border bg-[var(--pl-bg-soft)] border-[var(--pl-card-border)]",
                "text-[var(--pl-text-muted)]",
                "transition",
                "hover:text-[var(--pl-text)]",
                isFavorite ? "text-[var(--pl-primary)]" : "",
              ].join(" ")}
            >
              <StarIcon filled={isFavorite} />
            </button>

            {/* Fixed-height image area */}
            <div className="mb-3 flex h-[140px] w-full items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.displayName || product.name}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-[var(--pl-bg-soft)]">
                  <span className="text-sm text-[var(--pl-text-subtle)]">No image</span>
                </div>
              )}
            </div>

            {/* Title + brand */}
            <h3 className="text-center text-sm font-semibold leading-snug text-[var(--pl-text)] line-clamp-2">
              {product.displayName || product.name}
            </h3>

            {product.brand ? (
              <p className="mt-1 text-center text-xs text-[var(--pl-text-muted)] line-clamp-1">
                {product.brand}
              </p>
            ) : (
              // keep height stable if no brand
              <div className="mt-1 h-[16px]" />
            )}

            {/* Price block at bottom */}
            <div className="mt-auto pt-4 text-center">
              <p className="text-[11px] font-medium tracking-wide text-[var(--pl-text-subtle)]">
                Best price
              </p>

              <p className="mt-1 text-base font-bold text-[var(--pl-text)]">
                {bestPrice ?? "—"}
              </p>

              <p className="mt-1 text-xs text-[var(--pl-text-muted)] line-clamp-1">
                {bestStore ?? "—"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}