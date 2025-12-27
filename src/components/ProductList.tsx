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
        md:grid-cols-4
        xl:grid-cols-5
        gap-x-5 gap-y-8
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
            className={`
              relative
              flex flex-col items-center justify-start
              text-center
              rounded-xl
              border border-[var(--pl-card-border)]
              bg-[var(--pl-card)]/80
              backdrop-blur-md
              shadow-md
              p-4
              w-full
              overflow-hidden
              cursor-pointer
              transition-transform duration-200 hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(15,23,42,0.18)]
              ${isSelected ? "ring-2 ring-[var(--pl-primary)]" : ""}
            `}
          >
            {/* Favorite star */}
            <button
              type="button"
              aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              className={`absolute top-2 right-2 z-20 h-7 w-7 rounded-full border text-[11px] flex items-center justify-center transition-colors ${
                isFavorite
                  ? "bg-[var(--pl-primary)] text-white border-[var(--pl-primary)] shadow-[0_0_12px_var(--pl-primary-glow)]"
                  : "bg-[var(--pl-bg)]/70 text-[var(--pl-text-muted)] border-[var(--pl-card-border)] hover:text-[var(--pl-primary)] hover:border-[var(--pl-primary)]"
              }`}
            >
              ★
            </button>

            {/* Image */}
            <img
              src={product.imageUrl || "/placeholder.png"}
              alt={product.displayName || product.name}
              className="w-full h-[150px] object-contain mb-4"
            />

            {/* Name + brand */}
            <h3 className="text-sm font-semibold leading-tight mb-1 text-[var(--pl-text)] line-clamp-2">
              {product.displayName || product.name}
            </h3>
            {product.brand && (
              <p className="text-[11px] text-[var(--pl-text-subtle)] mb-1">
                {product.brand}
              </p>
            )}

            {/* Best price */}
            <div className="mt-1 mb-1">
              {bestListing ? (
                <>
                  <p className="text-base font-bold text-[var(--pl-text)]">
                    {formatPrice(minPrice, currency)}
                  </p>
                  <p className="text-[11px] text-[var(--pl-text-subtle)]">
                    from <span className="font-medium">{bestListing.storeName}</span>
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-[var(--pl-text-muted)]">No offers yet</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;