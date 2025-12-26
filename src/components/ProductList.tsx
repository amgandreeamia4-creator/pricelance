// src/components/ProductList.tsx
"use client";

import React from "react";
import Image from "next/image";

type Listing = {
  id: string;
  storeName: string;
  storeLogoUrl?: string | null;
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

  // One row per listing
  const rows: OfferRow[] = products.flatMap((product) =>
    (product.listings ?? []).map((listing) => ({ product, listing })),
  );

  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        const cardClasses =
          "relative flex items-center gap-3 rounded-xl border border-[var(--pl-card-border)] bg-[var(--pl-card)] p-3 shadow-sm transition hover:border-blue-500/50 " +
          (isSelected ? "border-blue-400 ring-2 ring-blue-500/40" : "") +
          (hasUrl ? " cursor-pointer" : " cursor-default opacity-90");

        const handleCardClick = (e: React.MouseEvent) => {
          // If clicking star or an explicit link, don't double-handle
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
              className="absolute right-2 top-2 z-10 rounded-full bg-[var(--pl-card)]/80 px-1.5 py-0.5 text-[12px] shadow-sm border border-[var(--pl-card-border)] hover:border-yellow-400/80 transition-colors"
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

            {/* Product thumbnail */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--pl-bg)]">
              {isValidImageUrl(product.imageUrl) ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[9px] text-[var(--pl-text-subtle)]">
                  No img
                </div>
              )}
            </div>

            {/* Product + store info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-[12px] font-semibold text-[var(--pl-text)] line-clamp-1 mb-1">
                {product.displayName || product.name}
              </h3>
              <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
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

            {/* Price / fast-delivery */}
            <div className="flex flex-col items-end text-right min-w-[90px]">
              <span className="text-[14px] font-semibold text-blue-400">
                {listing.price} {listing.currency}
              </span>

              {listing.fastDelivery && (
                <span className="text-[10px] text-emerald-400 mt-0.5">
                  Fast delivery
                </span>
              )}

              {freshnessText && (
                <span className="text-[10px] text-[var(--pl-text-subtle)] mt-0.5">
                  Price {freshnessText}
                </span>
              )}

              {isPriceStale && (
                <span className="text-[10px] text-amber-400 mt-0.5">
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