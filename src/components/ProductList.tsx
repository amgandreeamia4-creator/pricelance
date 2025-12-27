'use client';

import React from 'react';
import { getStoreDisplayName } from '@/lib/stores/registry';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

type Listing = {
  price: number;
  currency: string;
  storeName: string;
  affiliateProvider?: string | null;
  source?: string | null;
  fastDelivery?: boolean | null;
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
  isLoading: boolean; // added prop
};

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
  isLoading, // new
}: ProductListProps) {
  if (isLoading) {
    const skeletonItems = Array.from({ length: 8 });

    return (
      <div className="w-full md:overflow-x-auto md:pb-4 md:px-4">
        <div className="grid grid-cols-2 gap-4 w-full md:grid md:grid-rows-2 md:grid-flow-col md:auto-cols-[minmax(190px,210px)] md:gap-4 md:justify-start">
          {skeletonItems.map((_, idx) => (
            <div
              key={idx}
              className="relative flex flex-col items-center rounded-3xl bg-white/60 p-4 shadow-sm overflow-hidden animate-pulse"
            >
              {/* top label skeleton */}
              <div className="absolute inset-x-0 top-2 flex items-center justify-center gap-2 px-3">
                <div className="h-3 w-20 rounded-full bg-slate-200" />
                <div className="h-3 w-12 rounded-full bg-slate-200" />
              </div>

              {/* image skeleton */}
              <div className="mt-8 mb-3 flex h-28 w-full items-center justify-center">
                <div className="w-16 h-16 rounded-xl bg-slate-200" />
              </div>

              {/* title skeleton */}
              <div className="h-4 w-24 rounded-full bg-slate-200 mb-2" />

              {/* brand skeleton */}
              <div className="h-3 w-16 rounded-full bg-slate-200 mb-4" />

              {/* price + favorite skeleton */}
              <div className="mt-auto pt-3 flex items-end justify-between w-full">
                <div>
                  <div className="h-3 w-12 rounded-full bg-slate-200 mb-1" />
                  <div className="h-4 w-16 rounded-full bg-slate-200" />
                </div>
                <div className="h-7 w-7 rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
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

  // Compute best deal product ID (lowest price among all products)
  const bestDealProductId = React.useMemo(() => {
    const productsWithPrices = products
      .slice(0, 10)
      .map(product => ({
        id: product.id,
        bestListing: getBestListing(product.listings)
      }))
      .filter(({ bestListing }) => bestListing && typeof bestListing.price === 'number');
    
    if (productsWithPrices.length === 0) return null;
    
    const bestDeal = productsWithPrices.reduce((best, current) => 
      current.bestListing!.price < best.bestListing!.price ? current : best
    );
    
    return bestDeal.id;
  }, [products]);

  return (
    <div className="w-full md:overflow-x-auto md:pb-4 md:px-4">
      <div className="grid grid-cols-2 gap-4 w-full md:grid md:grid-rows-2 md:grid-flow-col md:auto-cols-[minmax(190px,210px)] md:gap-4 md:justify-start">
        {products.slice(0, 10).map((product) => {
          const isSelected = selectedProductId === product.id;
          const bestListing = getBestListing(product.listings);
          const isFavorite = favoriteIds.includes(product.id);

          const minPrice = bestListing?.price;
          const currency = bestListing?.currency ?? 'LEI';
          const storeLabel = getStoreDisplayName(bestListing || {});
          const isAffiliate = Boolean(bestListing?.affiliateProvider || bestListing?.source);

          const isBestDeal = product.id === bestDealProductId;

          const cardClasses = clsx(
            "relative flex flex-col items-center rounded-3xl bg-white/80 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden",
            isSelected && "ring-2 ring-blue-500",
            isBestDeal && "ring-2 ring-sky-400 shadow-xl bg-sky-50/80"
          );

          return (
            <motion.div
              key={product.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectProduct(product.id)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectProduct(product.id);
                }
              }}
              className={cardClasses}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              animate={isBestDeal ? { boxShadow: "0 0 24px rgba(56,189,248,0.55)" } : {}}
            >
              {isBestDeal && (
                <div className="absolute right-3 top-3 rounded-full bg-sky-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow z-10">
                  Best price
                </div>
              )}
              {/* Store name + Affiliate pill - absolutely positioned at top */}
              <div className="absolute inset-x-0 top-2 flex items-center justify-center gap-2 px-3">
                {storeLabel && (
                  <span className="max-w-[120px] truncate text-[11px] text-slate-500">
                    {storeLabel}
                  </span>
                )}
                {isAffiliate && (
                  <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600 bg-white/70 backdrop-blur">
                    Affiliate
                  </span>
                )}
              </div>

              {/* Product image */}
              <div className="mt-8 mb-3 flex h-28 w-full items-center justify-center">
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

              {/* Price section */}
              <div className="mt-auto pt-3 flex items-end justify-between w-full">
                <div>
                  {bestListing ? (
                    <>
                      <div className="text-[10px] text-slate-500 text-center">Best price</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {minPrice} {currency}
                      </div>
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}