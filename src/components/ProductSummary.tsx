"use client";

import React from "react";
import { getStoreDisplayName } from "@/lib/stores/registry";

type Listing = {
  id: string;
  storeName: string;
  price: number;
  currency: string;
  deliveryDays?: number | null;
  deliveryTimeDays?: number | null;
  fastDelivery?: boolean | null;
  priceLastSeenAt?: string | null;
  url?: string | null;
};

type Product = {
  id: string;
  name?: string | null;
  displayName?: string | null;
  listings?: Listing[];
};

type Props = {
  product: Product | null;
  selectedProductId: string | null;
  totalProducts: number;
  totalOffers: number;
};

const STALE_THRESHOLD_DAYS = 14;

function isListingStale(priceLastSeenAt: string | null | undefined): boolean {
  if (!priceLastSeenAt) return false;
  const d = new Date(priceLastSeenAt);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= STALE_THRESHOLD_DAYS;
}

function getProductFreshnessStatus(
  listings: Listing[] | undefined
): "fresh" | "stale" | "unknown" {
  if (!listings || listings.length === 0) return "unknown";

  let hasAnyFreshness = false;
  let allStale = true;

  for (const l of listings) {
    if (l.priceLastSeenAt) {
      hasAnyFreshness = true;
      if (!isListingStale(l.priceLastSeenAt)) {
        allStale = false;
      }
    }
  }

  if (!hasAnyFreshness) return "unknown";
  return allStale ? "stale" : "fresh";
}

function getCheapestListing(listings: Listing[] | undefined): Listing | null {
  if (!listings || listings.length === 0) return null;
  let cheapest: Listing | null = null;
  for (const l of listings) {
    if (cheapest == null || l.price < cheapest.price) {
      cheapest = l;
    }
  }
  return cheapest;
}

function getFastestListing(listings: Listing[] | undefined): Listing | null {
  if (!listings || listings.length === 0) return null;

  let best: Listing | null = null;

  const daysFor = (l: Listing): number | null => {
    if (typeof l.deliveryTimeDays === "number") return l.deliveryTimeDays;
    if (typeof l.deliveryDays === "number") return l.deliveryDays;
    if (l.fastDelivery) return 1;
    return null;
  };

  for (const l of listings) {
    const d = daysFor(l);
    if (d == null) continue;
    if (best == null) {
      best = l;
      continue;
    }
    const current = daysFor(best);
    if (current == null || d < current) {
      best = l;
    }
  }

  return best;
}

export default function ProductSummary({
  product,
  selectedProductId,
  totalProducts,
  totalOffers,
}: Props) {
  const hasProduct = !!product && Array.isArray(product.listings);

  const title =
    product?.displayName || product?.name || "the selected product";

  const cheapest = hasProduct ? getCheapestListing(product!.listings) : null;
  const fastest = hasProduct ? getFastestListing(product!.listings) : null;

  const freshnessStatus = hasProduct
    ? getProductFreshnessStatus(product!.listings)
    : "unknown";

  return (
    <div className="rounded-2xl border border-[var(--pl-card-border)] bg-[var(--pl-card)] p-4">
      <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-1">
        Best options for
      </h3>
      <p className="text-[11px] font-medium text-[var(--pl-text)] mb-2 line-clamp-1">
        {title}
      </p>
      <p className="text-[10px] text-[var(--pl-text-subtle)] mb-3">
        Found {totalProducts} product{totalProducts === 1 ? "" : "s"} with{" "}
        {totalOffers} offer{totalOffers === 1 ? "" : "s"}.
      </p>

      {!hasProduct || !product?.listings?.length ? (
        <p className="text-[11px] text-[var(--pl-text-subtle)]">
          Select a product from the list to see the best overall and fastest
          delivery options.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Best overall */}
            <div className="rounded-xl border border-[var(--pl-card-border)] bg-[var(--pl-bg)] p-3 flex flex-col items-center text-center gap-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pl-text-muted)]">
                Best overall
              </div>
              {cheapest ? (
                <>
                  <div className="text-[10px] leading-snug text-[var(--pl-text-muted)] break-words">
                    Balanced choice
                  </div>
                  <div className="text-[12px] font-semibold text-[var(--pl-text)] leading-tight">
                    {cheapest.price} {cheapest.currency}
                  </div>
                  <div className="text-[10px] leading-snug text-[var(--pl-text-muted)] break-words">
                    at {cheapest.storeName}
                  </div>
                </>
              ) : (
                <div className="text-[10px] leading-snug text-[var(--pl-text-subtle)]">
                  No price data yet.
                </div>
              )}
            </div>

            {/* Fastest delivery */}
            <div className="rounded-xl border border-[var(--pl-card-border)] bg-[var(--pl-bg)] p-3 flex flex-col items-center text-center gap-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pl-text-muted)]">
                Fastest delivery
              </div>
              {fastest ? (
                <>
                  <div className="text-[10px] leading-snug text-[var(--pl-text-muted)] break-words">
                    Speed first
                  </div>
                  <div className="text-[12px] font-semibold text-[var(--pl-text)] leading-tight">
                    {fastest.price} {fastest.currency}
                  </div>
                  <div className="text-[10px] leading-snug text-[var(--pl-text-muted)] break-words">
                    at {fastest.storeName}
                  </div>
                  <div className="text-[10px] leading-snug text-[var(--pl-text-muted)] break-words">
                    Est. delivery:{" "}
                    {fastest.deliveryTimeDays ??
                      fastest.deliveryDays ??
                      (fastest.fastDelivery ? 1 : "n/a")}{" "}
                    day
                    {((fastest.deliveryTimeDays ?? fastest.deliveryDays) ?? 1) !==
                    1
                      ? "s"
                      : ""}
                  </div>
                </>
              ) : (
                <div className="text-[10px] leading-snug text-[var(--pl-text-subtle)]">
                  No delivery estimate available.
                </div>
              )}
            </div>
          </div>

          {/* Freshness banner */}
          <div className="mt-3">
            {freshnessStatus === "stale" ? (
              <p className="text-[10px] text-amber-500 leading-relaxed">
                These prices may be outdated. Prices can change quickly, so
                please confirm directly on each store site.
              </p>
            ) : (
              <p className="text-[10px] text-[var(--pl-text-subtle)] leading-relaxed">
                Prices come from curated feeds and may change. Always confirm on
                the retailer site.
              </p>
            )}
          </div>

          {/* Offers section */}
          {(() => {
            const listings = product?.listings ?? [];
            const sortedListings = [...listings].sort((a, b) => a.price - b.price);
            
            return sortedListings.length > 0 ? (
              <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Oferte pentru acest produs
                </h4>

                <div className="flex flex-col gap-2">
                  {sortedListings.slice(0, 5).map((listing, index) => {
                    const storeLabel = getStoreDisplayName(listing);

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900/60"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {storeLabel}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {listing.price} {listing.currency ?? 'RON'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const url = listing.url;
                            if (!url) return;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          className="rounded-full bg-blue-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-600"
                        >
                          spre magazin »
                        </button>
                      </div>
                    );
                  })}
                </div>

                {sortedListings.length > 5 && (
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    + {sortedListings.length - 5} oferte suplimentare
                  </div>
                )}
              </div>
            ) : null;
          })()}
        </>
      )}
    </div>
  );
}
