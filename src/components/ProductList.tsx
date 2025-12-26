// src/components/ProductList.tsx
"use client";

import React from "react";
import Image from "next/image";

type Listing = {
  id: string;
  storeName: string;
  storeLogoUrl?: string | null;
  imageUrl?: string | null;
  price: number;
  currency: string;
  url?: string | null;

  fastDelivery?: boolean | null;
  deliveryDays?: number | null;
  inStock?: boolean | null;

  // New: affiliate metadata (optional)
  source?: string | null;
  affiliateProvider?: string | null;
  priceLastSeenAt?: string | null;
};

type Product = {
  id: string;
  name: string;
  displayName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  listings: Listing[];
};

interface Props {
  products: Product[];
  selectedProductId?: string | null;
  onSelectProduct?: (id: string) => void;
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
}

type OfferRow = {
  product: Product;
  listing: Listing;
};

function isValidImageUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function formatFreshnessAge(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "updated today";
  if (diffDays === 1) return "updated yesterday";
  if (diffDays < 14) return `updated ${diffDays} days ago`;
  if (diffDays < 30) return `updated over ${diffDays} days ago`;
  return "updated over 30 days ago";
}

function isStale(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 14;
}

export default function ProductList({
  products,
  selectedProductId,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
}: Props) {
  if (!products?.length) return null;

  // Compute best (lowest) price per product so we can highlight it
  const bestPriceByProduct = new Map<string, number>();
  for (const product of products) {
    const prices = (product.listings ?? [])
      .map((l) => l.price)
      .filter((p) => typeof p === "number" && Number.isFinite(p));
    if (prices.length) {
      bestPriceByProduct.set(product.id, Math.min(...prices));
    }
  }

  // One row per listing
  const rows: OfferRow[] = products.flatMap((product) =>
    (product.listings ?? []).map((listing) => ({ product, listing })),
  );

  if (rows.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <p className="col-span-full text-[10px] text-slate-500 dark:text-slate-400">
        Some store links are affiliate links. They help support PriceLance, but don&apos;t change the prices you pay.
      </p>
      {rows.map(({ product, listing }) => {
        const isSelected =
          selectedProductId != null && selectedProductId === product.id;
        const isFavorite = favoriteIds.includes(product.id);
        const hasUrl =
          typeof listing.url === "string" && listing.url.trim().length > 0;

        const freshnessText = formatFreshnessAge(listing.priceLastSeenAt ?? null);
        const isPriceStale = isStale(listing.priceLastSeenAt ?? null);

        const minPriceForProduct = bestPriceByProduct.get(product.id);
        const isBestPrice =
          minPriceForProduct != null && listing.price === minPriceForProduct;

        const imageSrc = listing.imageUrl || product.imageUrl || null;

        let cardClasses =
          "relative flex h-full flex-col rounded-2xl border border-[var(--pl-card-border)] bg-[var(--pl-card)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

        if (hasUrl) {
          cardClasses += " cursor-pointer";
        } else {
          cardClasses += " cursor-default opacity-90";
        }

        if (isBestPrice) {
          cardClasses +=
            " ring-2 ring-blue-400/70 ring-offset-2 ring-offset-slate-50 dark:ring-blue-300/70 dark:ring-offset-slate-900";
        } else if (isSelected) {
          cardClasses += " ring-2 ring-blue-500/40";
        }

        const handleCardClick = (e: React.MouseEvent) => {
          // If clicking star or an explicit link, don&apos;t double-handle
          const target = e.target as HTMLElement;
          if (
            target.closest('[data-favorite-btn="true"]') ||
            target.closest("a")
          ) {
            return;
          }

          onSelectProduct?.(product.id);

          if (hasUrl && listing.url) {
            window.open(listing.url, "_blank", "noopener,noreferrer");
          }
        };

        const formattedPrice = listing.price;
        const currencyLabel = listing.currency;

        return (
          <div
            key={`${product.id}-${listing.id}`}
            className={cardClasses}
            onClick={handleCardClick}
          >
            {/* Favorite toggle */}
            <button
              type="button"
              data-favorite-btn="true"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
              className="absolute right-2 top-2 z-20 rounded-full bg-[var(--pl-card)]/80 px-1.5 py-0.5 text-[12px] shadow-sm border border-[var(--pl-card-border)] hover:border-yellow-400/80 transition-colors"
            >
              <span
                className={
                  isFavorite
                    ? "text-yellow-400"
                    : "text-[var(--pl-text-subtle)]"
                }
              >
                ★
              </span>
            </button>

            {/* Best price badge */}
            {isBestPrice && (
              <div className="absolute left-3 top-3 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 shadow-sm dark:bg-blue-900/70 dark:text-blue-200">
                Best price
              </div>
            )}

            {/* Image + name + store */}
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-20 rounded-xl bg-[var(--pl-bg)] overflow-hidden flex items-center justify-center">
                {imageSrc && isValidImageUrl(imageSrc) ? (
                  <Image
                    src={imageSrc}
                    alt={
                      product.displayName ||
                      product.name ||
                      listing.storeName ||
                      "Product image"
                    }
                    fill
                    sizes="80px"
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-[10px] text-[var(--pl-text-subtle)]">
                    No image
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="truncate text-[12px] font-semibold text-[var(--pl-text)]">
                  {product.displayName || product.name}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  {isValidImageUrl(listing.storeLogoUrl) ? (
                    <Image
                      src={listing.storeLogoUrl}
                      alt={listing.storeName}
                      width={14}
                      height={14}
                      className="rounded-sm"
                      unoptimized
                    />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded bg-[var(--pl-card-border)]" />
                  )}
                  <span className="text-[11px] text-[var(--pl-text-muted)]">
                    {listing.storeName}
                  </span>
                  {listing.source === "affiliate" && listing.affiliateProvider && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 px-2 py-0.5 text-[10px] font-medium border border-blue-100 dark:border-blue-800">
                      Affiliate
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price row */}
            <div className="mt-3 flex items-baseline gap-2">
              <div className="flex flex-col min-w-0 flex-1">
                {freshnessText && (
                  <span className="text-[11px] text-[var(--pl-text-subtle)]">
                    Price {freshnessText}
                  </span>
                )}
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <div className="min-w-[88px] text-right text-sm font-semibold text-sky-600 dark:text-sky-300">
                  {formattedPrice}
                </div>
                <div className="text-[11px] text-[var(--pl-text-subtle)]">
                  {currencyLabel}
                </div>
              </div>
            </div>

            {/* Bottom metadata */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-[var(--pl-text-subtle)]">
              {listing.fastDelivery && (
                <span className="text-emerald-400">Fast delivery</span>
              )}
              {isPriceStale && (
                <span className="text-amber-400">
                  May be outdated – please double-check on the store.
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}