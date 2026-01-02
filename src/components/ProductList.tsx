'use client';

import React from 'react';
import { getStoreDisplayName } from '@/lib/stores/registry';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { useSpring, animated, config } from '@react-spring/web';
import { isListingFromDisabledNetwork } from '@/config/affiliateNetworks';

type Listing = {
  price: number;
  currency: string;
  storeName: string;
  url?: string | null; // ✅ link to retailer
  affiliateProvider?: string | null;
  source?: string | null;
  fastDelivery?: boolean | null;
  network?: string | null; // Legacy field - kept for compatibility
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
};

// 🔒 how many we show in the main table
const MAX_VISIBLE_PRODUCTS = 6;

// soft threshold for "Budget pick" badge
const BUDGET_THRESHOLD = 1000;

// map store label to a soft color chip
function getStoreToneClasses(storeLabel?: string | null) {
  if (!storeLabel) return 'bg-slate-100 text-slate-600';

  const label = storeLabel.toLowerCase();

  if (label.includes('emag')) return 'bg-sky-100 text-sky-700';
  if (label.includes('altex')) return 'bg-amber-100 text-amber-700';
  if (label.includes('pcgarage')) return 'bg-rose-100 text-rose-700';
  if (label.includes('evomag')) return 'bg-indigo-100 text-indigo-700';
  if (label.includes('flanco')) return 'bg-emerald-100 text-emerald-700';

  return 'bg-slate-100 text-slate-600';
}

function getBestListing(listings: Listing[] | undefined | null): Listing | null {
  if (!listings || listings.length === 0) return null;
  return listings.reduce((best, l) => (l.price < best.price ? l : best));
}

export default function ProductList({
  products,
  selectedProductId,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  isLoading,
}: ProductListProps) {
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

  const visibleProducts = products.slice(0, MAX_VISIBLE_PRODUCTS);

  // Best deal = lowest price among visible products
  const bestDealProductId = React.useMemo(() => {
    const productsWithPrices = visibleProducts
      .map((product) => ({
        id: product.id,
        bestListing: getBestListing(product.listings),
      }))
      .filter(({ bestListing }) => bestListing && typeof bestListing.price === 'number');

    if (productsWithPrices.length === 0) return null;

    const bestDeal = productsWithPrices.reduce((best, current) =>
      current.bestListing!.price < best.bestListing!.price ? current : best
    );

    return bestDeal.id;
  }, [visibleProducts]);

  // helper to open URLs safely
  const openListing = (url?: string | null) => {
    if (!url) return;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // fail silently – no need to crash UI
    }
  };

  // Flip card animation state
  const [flippedCard, setFlippedCard] = React.useState<string | null>(null);

  // Spring animation
  const { transform, opacity } = useSpring({
    opacity: flippedCard ? 1 : 0,
    transform: flippedCard ? 'rotateY(180deg)' : 'rotateY(0deg)',
    config: config.wobbly,
  });

  return (
    <div className="w-full">
      {/* SIMPLE, STABLE GRID: up to 3 cards per row on desktop */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {visibleProducts.map((product) => {
          const isSelected = selectedProductId === product.id;
          const bestListing = getBestListing(product.listings);
          const isFavorite = favoriteIds.includes(product.id);
          const offerCount = product.listings?.length ?? 0;

          const minPrice = bestListing?.price;
          const currency = bestListing?.currency ?? 'LEI';
          const storeLabel = getStoreDisplayName(bestListing || {});
          const bestListingUrl = bestListing?.url ?? undefined;
          const isAffiliate = Boolean(bestListing?.affiliateProvider || bestListing?.source);

          // Check if this listing should be disabled (secondary safety layer)
          const shouldDisableLink = isListingFromDisabledNetwork(bestListing || {});
          const finalListingUrl = shouldDisableLink ? undefined : bestListingUrl;

          const isBestDeal = product.id === bestDealProductId;

          // ✅ badges
          const hasFastDelivery = product.listings.some((l) => l.fastDelivery);
          const isPopular = product.listings.length >= 4;
          const isBudget = typeof minPrice === 'number' && minPrice <= BUDGET_THRESHOLD;

          const badges: string[] = [];
          if (hasFastDelivery) badges.push('Fast delivery');
          if (isBudget) badges.push('Budget pick');
          if (isPopular) badges.push('Popular');
          const limitedBadges = badges.slice(0, 2);

          const cardClasses = clsx(
            'relative flex flex-col items-center rounded-3xl bg-white/90 p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-shadow transition-transform duration-150 cursor-pointer overflow-hidden',
            isSelected && 'ring-2 ring-blue-500',
            isBestDeal && 'ring-2 ring-sky-400 shadow-xl bg-sky-50/90'
          );

          const storeTone = getStoreToneClasses(storeLabel);

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
                <div className="absolute right-3 top-3 rounded-full bg-sky-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow z-10">
                  Best price
                </div>
              )}

              {/* Store name + Affiliate pill (store chip is now a link if url exists) */}
              <div className="absolute inset-x-0 top-2 flex items-center justify-center gap-2 px-3">
                {storeLabel && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (finalListingUrl) {
                        openListing(finalListingUrl);
                      }
                    }}
                    disabled={shouldDisableLink || false}
                    className={clsx(
                      'max-w-[140px] truncate rounded-full px-2 py-0.5 text-[11px] font-medium border border-transparent transition-colors',
                      storeTone,
                      finalListingUrl && !shouldDisableLink && 'hover:border-sky-400 hover:shadow-sm',
                      shouldDisableLink && 'opacity-50 cursor-not-allowed'
                    )}
                    title={shouldDisableLink ? 'Temporarily unavailable' : undefined}
                  >
                    {storeLabel}
                  </button>
                )}
                {isAffiliate && (
                  <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600 bg-white/70 backdrop-blur">
                    Affiliate
                  </span>
                )}
              </div>

              {/* Product image */}
              <div className="mt-8 mb-3 flex h-24 w-full items-center justify-center">
                <div className="w-16 h-16 rounded-xl border overflow-hidden flex items-center justify-center">
                  <img
                    src={product.imageUrl || '/placeholder.png'}
                    alt={product.displayName || product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Product name */}
              <h3 className="mt-1 text-center text-sm font-medium text-slate-800 line-clamp-2">
                {product.displayName ?? product.name}
              </h3>

              {/* Brand */}
              {product.brand && (
                <p className="mt-0.5 text-center text-[10px] text-slate-600 line-clamp-1">
                  {product.brand}
                </p>
              )}

              {/* Story badges row */}
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

              {/* Price + favorite */}
              <div className="mt-auto pt-3 flex items-end justify-between w-full">
                <div>
                  {bestListing ? (
                    <>
                      <div className="text-[10px] text-slate-500 text-center">Best price</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {minPrice} {currency}
                      </div>
                      {offerCount > 1 && (
                        <div className="mt-0.5 text-[10px] text-slate-500">
                          {offerCount} oferte disponibile
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-[10px] text-slate-500">No price</div>
                  )}
                </div>
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
          );
        })}
      </div>

      {products.length > MAX_VISIBLE_PRODUCTS && (
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Showing first {visibleProducts.length} of {products.length} results. More result views
          coming soon.
        </p>
      )}
    </div>
  );
}