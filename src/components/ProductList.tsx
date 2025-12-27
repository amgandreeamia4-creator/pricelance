'use client';

import React from 'react';

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
  isLoading: boolean; // ✅ added prop
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
  isLoading, // ✅ new
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

  return (
    <div className="grid grid-cols-5 gap-4 w-full">
      {products.slice(0, 10).map((product) => {
        const isSelected = selectedProductId === product.id;
        const bestListing = getBestListing(product.listings);
        const isFavorite = favoriteIds.includes(product.id);

        const minPrice = bestListing?.price;
        const currency = bestListing?.currency ?? 'LEI';
        const storeName = bestListing?.storeName;
        const isAffiliate = Boolean(bestListing?.affiliateProvider || bestListing?.source);

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
            className={`relative flex flex-col items-center rounded-3xl bg-white/80 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {/* Store name + Affiliate pill - absolutely positioned at top */}
            <div className="absolute inset-x-0 top-2 flex items-center justify-center gap-2 px-3">
              {storeName && (
                <span className="max-w-[120px] truncate text-[11px] text-slate-500">
                  {storeName}
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
                ★
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}