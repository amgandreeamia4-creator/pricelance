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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
            className="group relative [perspective:1000px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pl-bg)]"
            onClick={() => onSelectProduct(product.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectProduct(product.id);
              }
            }}
          >
            {/* Favorite star overlay */}
            <button
              type="button"
              aria-label={
                isFavorite ? "Remove from favourites" : "Add to favourites"
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              className={`absolute z-20 top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] transition-colors ${
                isFavorite
                  ? "bg-[var(--pl-primary)] text-white border-[var(--pl-primary)] shadow-[0_0_12px_var(--pl-primary-glow)]"
                  : "bg-[var(--pl-bg)]/80 text-[var(--pl-text-muted)] border-[var(--pl-card-border)] hover:text-[var(--pl-primary)] hover:border-[var(--pl-primary)]"
              }`}
            >
              ★
            </button>

            {/* Twinkle sparkle (optional, just for fun) */}
            <span className="absolute top-1 left-2 text-yellow-300 text-xs twinkle pointer-events-none">
              ✨
            </span>

            {/* Flip card core */}
            <div
              className={`
                relative h-full w-full rounded-xl border 
                border-[var(--pl-card-border)] bg-[var(--pl-card)]/60 
                backdrop-blur-md shadow-inner transition-transform duration-500 
                [transform-style:preserve-3d] 
                ${isSelected ? "ring-2 ring-[var(--pl-primary)]" : ""}
                group-hover:[transform:rotateY(180deg)]
              `}
            >
              {/* FRONT */}
              <div className="absolute inset-0 p-4 flex flex-col items-center text-center gap-2 [backface-visibility:hidden]">
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg bg-[var(--pl-bg)]/60 border border-[var(--pl-card-border)] flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl || "/placeholder.png"}
                      alt={product.displayName || product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-xs font-semibold text-[var(--pl-text)] line-clamp-2">
                    {product.displayName || product.name}
                  </h3>

                  {product.brand && (
                    <p className="text-[10px] text-[var(--pl-text-subtle)]">
                      {product.brand}
                    </p>
                  )}
                </div>

                {/* Price & highlight */}
                <div className="w-full flex flex-col items-center gap-1 mt-1">
                  {bestListing ? (
                    <>
                      <span className="text-[11px] text-[var(--pl-text-muted)]">
                        Best price
                      </span>
                      <span className="text-sm font-semibold text-[var(--pl-text)]">
                        {formatPrice(minPrice, currency)}
                      </span>
                      <span className="text-[10px] text-[var(--pl-text-subtle)]">
                        from{" "}
                        <span className="font-medium">
                          {bestListing.storeName}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-[var(--pl-text-muted)]">
                      No offers available yet
                    </span>
                  )}
                  <span className="mt-1 inline-flex items-center justify-center rounded-full border border-[var(--pl-card-border)] px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--pl-text-muted)] bg-[var(--pl-bg)]/60">
                    Highlight
                  </span>
                </div>
              </div>

              {/* BACK */}
              <div className="absolute inset-0 p-4 flex flex-col justify-center gap-2 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <h4 className="text-[11px] font-semibold text-[var(--pl-text)] mb-1">
                  Top offers
                </h4>
                {product.listings && product.listings.length > 0 ? (
                  <>
                    {product.listings.slice(0, 3).map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between text-[11px] mb-0.5"
                      >
                        <span className="truncate mr-2 text-[var(--pl-text-muted)]">
                          {l.storeName}
                        </span>
                        <span className="font-medium text-[var(--pl-text)]">
                          {formatPrice(l.price, l.currency)}
                        </span>
                      </div>
                    ))}
                    <p className="mt-2 text-[10px] italic text-[var(--pl-primary)]">
                      + more listings in full view
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-[var(--pl-text-muted)]">
                    No listings yet for this product.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;