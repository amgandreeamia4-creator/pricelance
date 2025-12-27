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
};

function formatPrice(price: number, currency: string) {
  if (!Number.isFinite(price)) return "No price";
  return `${price.toFixed(2)} ${currency || ""}`.trim();
}

function getBestListing(listings: Listing[] | undefined | null): Listing | null {
  if (!listings || listings.length === 0) return null;
  return listings.reduce((best, l) => (l.price < best.price ? l : best));
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  selectedProductId,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
}) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div
      className="
        grid
        grid-cols-2
        sm:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
        gap-6
        w-full
      "
    >
      {products.map((product) => {
        const isSelected = selectedProductId === product.id;
        const bestListing = getBestListing(product.listings);
        const isFavorite = favoriteIds.includes(product.id);
        const minPrice = bestListing?.price ?? NaN;
        const currency = bestListing?.currency ?? "LEI";

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelectProduct(product.id)}
            className={`
              relative
              mx-auto
              min-w-[180px] max-w-[220px] w-full
              flex flex-col items-center text-center
              rounded-2xl
              border border-[var(--pl-card-border)]
              bg-[var(--pl-card)]/80
              backdrop-blur-md
              p-4
              overflow-hidden
              transition-all duration-200
              hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(15,23,42,0.18)]
              ${isSelected ? "ring-2 ring-[var(--pl-primary)]" : ""}
            `}
          >
            {/* Favorite star */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              className={`
                absolute top-2 right-2 z-20 h-7 w-7 rounded-full border
                text-[11px] flex items-center justify-center cursor-pointer
                transition-colors
                ${
                  isFavorite
                    ? "bg-[var(--pl-primary)] text-white border-[var(--pl-primary)] shadow-[0_0_12px_var(--pl-primary-glow)]"
                    : "bg-[var(--pl-bg)]/70 text-[var(--pl-text-muted)] border-[var(--pl-card-border)] hover:text-[var(--pl-primary)] hover:border-[var(--pl-primary)]"
                }
              `}
            >
              ★
            </span>

            {/* Image */}
            <div className="w-full h-[140px] mb-3 flex items-center justify-center">
              <img
                src={product.imageUrl || "/placeholder.png"}
                alt={product.displayName || product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Name + brand */}
            <h3 className="text-xs font-semibold leading-tight mb-1 text-[var(--pl-text)] line-clamp-2">
              {product.displayName || product.name}
            </h3>
            {product.brand && (
              <p className="text-[11px] text-[var(--pl-text-subtle)] mb-2">
                {product.brand}
              </p>
            )}

            {/* Best price */}
            <div className="mt-auto">
              {bestListing ? (
                <>
                  <p className="text-[11px] text-[var(--pl-text-muted)] mb-0.5">
                    Best price
                  </p>
                  <p className="text-sm font-semibold text-[var(--pl-text)]">
                    {formatPrice(minPrice, currency)}
                  </p>
                  <p className="text-[11px] text-[var(--pl-text-subtle)]">
                    from <span className="font-medium">{bestListing.storeName}</span>
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-[var(--pl-text-muted)]">
                  No offers yet
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ProductList;