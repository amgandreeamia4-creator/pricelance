// src/components/ProductList.tsx
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { isListingFromDisabledNetwork } from '@/config/affiliateNetworks';
import { STORE_REGISTRY, type StoreMeta } from '@/lib/stores/registry';

type Listing = {
  price: number | null;
  currency: string | null;
  storeName?: string | null;
  storeId?: string | null;
  url?: string | null; // link to retailer
  affiliateProvider?: string | null;
  source?: string | null;
  fastDelivery?: boolean | null;
  network?: string | null; // Legacy field - kept for compatibility
  imageUrl?: string | null; // Listing-specific image URL
  countryCode?: string | null; // For international badges
};

type Product = {
  id: string;
  name: string;
  displayName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  listings: Listing[];
};

type ProductListProps = {
  products: Product[];
  selectedProductId: string | null;
  onSelectProduct: (id: string) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  isLoading: boolean;
  userLocation?: string | null;
};

const MAX_VISIBLE_PRODUCTS = 6;
const BUDGET_THRESHOLD = 1000;

// ---------- Store helpers ----------

function getHostname(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

function lookupStoreNameFromRegistry(storeId?: string | null): string | null {
  if (!storeId) return null;
  const registry = STORE_REGISTRY as Record<string, StoreMeta>;
  const meta = registry[storeId];
  return meta?.name ?? null;
}

function lookupStoreNameFromDomain(hostname: string | null): string | null {
  if (!hostname) return null;
  const lowerHost = hostname.toLowerCase();
  const registry = STORE_REGISTRY as Record<string, StoreMeta>;

  for (const meta of Object.values(registry)) {
    if (!meta.domains || meta.domains.length === 0) continue;
    const lowerDomains = meta.domains.map((d) => d.toLowerCase());
    if (lowerDomains.some((d) => lowerHost === d || lowerHost.endsWith(`.${d}`))) {
      return meta.name;
    }
  }

  return null;
}

function getNumericPrice(listing: Listing | undefined | null): number | null {
  if (!listing) return null;
  const raw = (listing as any).price;
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function deriveStoreName(listing: Listing | undefined): string {
  if (!listing) return 'Unknown store';

  const explicitName = listing.storeName?.trim();
  if (explicitName) {
    return explicitName;
  }

  // 1) storeId → registry (eMAG, PC Garage, Altex, etc.)
  const fromRegistry = lookupStoreNameFromRegistry(listing.storeId ?? null);
  if (fromRegistry) return fromRegistry;

  // 2) hostname from URL → registry → hostname
  const hostname = getHostname(listing.url);
  if (hostname) {
    const fromDomain = lookupStoreNameFromDomain(hostname);
    if (fromDomain) return fromDomain;
    return hostname;
  }

  // 3) last resort
  return 'Unknown store';
}

function derivePrimaryPrice(listing: Listing | undefined): string | null {
  const numeric = getNumericPrice(listing);
  if (numeric === null) return null;
  const currency = listing?.currency || 'RON';
  return `${numeric.toLocaleString('ro-RO')} ${currency}`;
}

function getBestListing(listings: Listing[] | undefined | null): Listing | null {
  if (!listings || listings.length === 0) return null;

  // Prefer listings that:
  // - are not from disabled affiliate networks
  // - have a numeric price
  const candidates = listings.filter((l) => {
    if (isListingFromDisabledNetwork(l as any)) return false;
    return getNumericPrice(l) !== null;
  });

  if (candidates.length === 0) {
    // Fallback: any non-disabled listing, or just the first listing
    const nonDisabled = listings.find((l) => !isListingFromDisabledNetwork(l as any));
    return nonDisabled ?? listings[0];
  }

  return candidates.reduce((best, current) => {
    const bestPrice = getNumericPrice(best)!;
    const currentPrice = getNumericPrice(current)!;
    return currentPrice < bestPrice ? current : best;
  });
}

function getOfferCountForProduct(p: Product): number {
  if (!p.listings || p.listings.length === 0) return 0;
  return p.listings.filter(
    (l) => typeof l.price === "number" && Number.isFinite(l.price)
  ).length;
}

// ---------- UI bits ----------

function StoreChips({
                      storeName,
                      isAffiliate,
                    }: {
  storeName: string;
  isAffiliate: boolean;
}) {
  return (
      <div className="flex flex-col items-center gap-1 mt-2">
      <span className="rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium px-3 py-1">
        {storeName}
      </span>
        {isAffiliate && (
            <span className="rounded-full border border-slate-200 bg-slate-50 text-slate-500 text-[11px] px-3 py-1">
          AFFILIATE
        </span>
        )}
      </div>
  );
}

export default function ProductList({
                                      products,
                                      selectedProductId,
                                      onSelectProduct,
                                      favoriteIds,
                                      onToggleFavorite,
                                      isLoading,
                                      userLocation,
                                    }: ProductListProps) {
  const [sortKey, setSortKey] = React.useState<'relevance' | 'price-asc' | 'price-desc'>(
      'relevance',
  );

  const sortedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    // Helper: best price for a product using existing getBestListing
    const getBestPrice = (p: Product): number => {
      const best = getBestListing(p.listings);
      if (!best || typeof best.price !== "number" || !Number.isFinite(best.price)) {
        return Number.MAX_SAFE_INTEGER;
      }
      return best.price;
    };

    if (sortKey === "price-asc") {
      return [...products].sort((a, b) => getBestPrice(a) - getBestPrice(b));
    }

    if (sortKey === "price-desc") {
      return [...products].sort((a, b) => getBestPrice(b) - getBestPrice(a));
    }

    // Default: "relevance" – explicit comparison-first ordering.
    const comparisonProducts: Product[] = [];
    const singleOfferProducts: Product[] = [];

    for (const p of products) {
      const offers = getOfferCountForProduct(p);
      if (offers >= 2) {
        comparisonProducts.push(p);
      } else {
        singleOfferProducts.push(p);
      }
    }

    // Sort each group by best price (cheapest first).
    comparisonProducts.sort((a, b) => getBestPrice(a) - getBestPrice(b));
    singleOfferProducts.sort((a, b) => getBestPrice(a) - getBestPrice(b));

    // Comparison products first, then single-offer products.
    return [...comparisonProducts, ...singleOfferProducts];
  }, [products, sortKey]);

  const visibleProducts = useMemo(() => {
    if (!sortedProducts || sortedProducts.length === 0) return [];
    return sortedProducts.slice(0, MAX_VISIBLE_PRODUCTS);
  }, [sortedProducts]);

  const openListing = (url?: string | null) => {
    if (!url) return;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore
    }
  };

  const bestDealProductId = useMemo(() => {
    const productsWithPrices = visibleProducts
        .map((product) => {
          const bestListing = getBestListing(product.listings);
          const price = getNumericPrice(bestListing);
          return { id: product.id, bestListing, price };
        })
        .filter(({ price }) => price !== null);

    if (productsWithPrices.length === 0) return null;

    const bestDeal = productsWithPrices.reduce((best, current) =>
        current.price! < best.price! ? current : best,
    );

    return bestDeal.id;
  }, [visibleProducts]);

  if (isLoading) {
    return (
        <div className="w-full text-center py-10 text-sm text-muted-foreground">
          Loading products...
        </div>
    );
  }

  if (!products || products.length === 0) {
    return (
        <div className="w-full text-center py-10 text-sm text-muted-foreground">
          No results found.
        </div>
    );
  }

  return (
      <div className="w-full">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {visibleProducts.map((product) => {
            const isSelected = selectedProductId === product.id;
            const isFavorite = favoriteIds.includes(product.id);
            const offerCount = product.listings?.length ?? 0;

            // Always pick the cheapest non-disabled listing as the “primary” one for the card
            const bestListing = getBestListing(product.listings);
            const primaryListing = bestListing || product.listings?.[0];

            const formattedPrice = derivePrimaryPrice(primaryListing);
            const storeLabel = deriveStoreName(primaryListing);
            const bestListingUrl = bestListing?.url ?? undefined;
            // Only show the AFFILIATE badge when we actually have an affiliateProvider.
            // A generic `source` like "manual" or "csv" should NOT trigger the badge.
            const isAffiliate = Boolean(bestListing?.affiliateProvider);
            const isBestDeal = product.id === bestDealProductId;

            const shouldDisableLink = isListingFromDisabledNetwork(
                (bestListing || {}) as any,
            );
            const finalListingUrl = shouldDisableLink ? undefined : bestListingUrl;

            const hasFastDelivery = product.listings.some((l) => l.fastDelivery);
            const isPopular = product.listings.length >= 4;
            const bestPriceNumeric = getNumericPrice(bestListing);
            const isBudget =
                bestPriceNumeric !== null && bestPriceNumeric <= BUDGET_THRESHOLD;

            const isInternational =
                userLocation &&
                bestListing?.countryCode &&
                bestListing.countryCode.toLowerCase() !==
                userLocation.toLowerCase();

            const badges: string[] = [];
            if (hasFastDelivery) badges.push('Fast delivery');
            if (isBudget) badges.push('Budget pick');
            if (isPopular) badges.push('Popular');
            if (isInternational) badges.push('Intl.');
            const limitedBadges = badges.slice(0, 2);

            const cardClasses = clsx(
                'relative flex flex-col items-center rounded-3xl bg-white/90 p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-shadow transition-transform duration-150 cursor-pointer overflow-hidden',
                isSelected && 'ring-2 ring-blue-500',
                isBestDeal && 'ring-2 ring-sky-400 shadow-xl bg-sky-50/90',
            );

            const showStoreChip = !!primaryListing && storeLabel !== 'Unknown store';

            return (
                <div
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectProduct(product.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectProduct(product.id);
                      }
                    }}
                    className={cardClasses}
                >
                  {isBestDeal && (
                      <div className="rounded-full bg-sky-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                        Best price
                      </div>
                  )}

                  {showStoreChip && (
                      <div
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (finalListingUrl) {
                              openListing(finalListingUrl);
                            }
                          }}
                      >
                        <StoreChips storeName={storeLabel} isAffiliate={isAffiliate} />
                      </div>
                  )}

                  <div className="mt-8 mb-3 flex h-24 w-full items-center justify-center">
                    <div className="w-16 h-16 rounded-xl border overflow-hidden flex items-center justify-center">
                      <img
                          src={bestListing?.imageUrl || product.imageUrl || '/placeholder.png'}
                          alt={product.displayName || product.name}
                          className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <h3 className="mt-1 text-center text-sm font-medium text-slate-800 line-clamp-2">
                    {product.displayName ?? product.name}
                  </h3>

                  {product.brand && (
                      <p className="mt-0.5 text-center text-[10px] text-slate-600 line-clamp-1">
                        {product.brand}
                      </p>
                  )}

                  {limitedBadges.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
                        {limitedBadges.map((label) => (
                            <span
                                key={label}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                            >
                      {label}
                    </span>
                        ))}
                      </div>
                  )}

                  <div className="mt-auto pt-3 flex flex-col gap-2 w-full">
                    <div>
                      {formattedPrice ? (
                          <>
                            <div className="text-[10px] text-slate-500 text-center">Price</div>
                            <div className="text-sm font-semibold text-slate-900">
                              {formattedPrice}
                            </div>
                            {offerCount > 0 && (
                                <div className="mt-0.5 text-[10px] text-slate-500">
                                  {offerCount === 1
                                      ? '1 offer available'
                                      : `${offerCount} offers available`}
                                </div>
                            )}
                          </>
                      ) : (
                          <div className="text-[10px] text-slate-500">No price</div>
                      )}
                    </div>

                    <Link
                        href={`/products/${product.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      See offers
                    </Link>

                    <div className="flex justify-end">
                      <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(product.id);
                          }}
                          className={`h-7 w-7 rounded-full border flex items-center justify-center text-xs transition-colors ${
                              isFavorite
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'text-slate-400 border-slate-300'
                          }`}
                      >
                        <Star
                            className="h-4 w-4"
                            fill={isFavorite ? 'currentColor' : 'none'}
                            strokeWidth={2}
                        />
                      </button>
                    </div>
                  </div>
                </div>
            );
          })}
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-500">
          {!products || products.length === 0 ? (
              <>No results found.</>
          ) : products.length <= MAX_VISIBLE_PRODUCTS ? (
              <>Showing {products.length} results.</>
          ) : (
              <>
                Showing first {MAX_VISIBLE_PRODUCTS} of {products.length} results. More
                result views coming soon.
              </>
          )}
        </div>
      </div>
  );
}