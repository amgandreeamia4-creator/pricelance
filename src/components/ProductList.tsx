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
            className={`rounded-2xl border px-3 py-3 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex gap-2">
              <div className="w-16 h-16 rounded-xl border overflow-hidden flex items-center justify-center">
                <img
                  src={product.imageUrl || '/placeholder.png'}
                  alt={product.displayName || product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold leading-snug line-clamp-2">
                  {product.displayName || product.name}
                </h3>
                {product.brand && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                    {product.brand}
                  </p>
                )}
                {storeName && (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] text-[var(--pl-text)] font-medium">
                      {storeName}
                    </span>
                    {isAffiliate && (
                      <span className="rounded-full border border-[var(--pl-primary)] bg-[var(--pl-primary)]/5 text-[var(--pl-primary)] px-2 py-[2px] uppercase tracking-tight text-[9px]">
                        Affiliate
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                {bestListing ? (
                  <>
                    <div className="text-[10px] text-muted-foreground">Best price</div>
                    <div className="text-sm font-semibold">
                      {minPrice} {currency}
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-muted-foreground">No price</div>
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
                    : 'text-muted-foreground border'
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