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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-6">
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
            className="group relative min-w-[160px] p-3 sm:p-4 [perspective:1200px] focus-visible:ring-2 focus-visible:ring-[var(--pl-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pl-bg)] outline-none transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(15,23,42,0.18)]"
            onClick={() => onSelectProduct(product.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectProduct(product.id);
              }
            }}
          >
            {/* Flip card wrapper */}
            <div
              className={`relative h-full min-h-[260px] w-full rounded-2xl border border-[var(--pl-card-border)] bg-[var(--pl-card)]/50 backdrop-blur-md shadow-inner [transform-style:preserve-3d] transition-transform duration-500 group-hover:[transform:rotateY(180deg)] ${
                isSelected ? "ring-2 ring-[var(--pl-primary)]" : ""
              }`}
            >
              {/* Favorite Star (only star we keep) */}
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

              {/* FRONT SIDE */}
              <div className="absolute inset-0 p-4 flex flex-col items-center text-center justify-between [backface-visibility:hidden]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-lg bg-[var(--pl-bg)]/50 border border-[var(--pl-card-border)] overflow-hidden flex items-center justify-center">
                    <img
                      src={product.imageUrl || "/placeholder.png"}
                      alt={product.displayName || product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <h3 className="text-xs font-semibold text-[var(--pl-text)] line-clamp-2">
                    {product.displayName || product.name}
                  </h3>

                  {product.brand && (
                    <p className="text-[10px] text-[var(--pl-text-subtle)]">{product.brand}</p>
                  )}
                </div>

                <div className="flex flex-col items-center mt-2 gap-0.5">
                  {bestListing ? (
                    <>
                      <span className="text-[11px] text-[var(--pl-text-muted)]">Best price</span>
                      <span className="text-sm font-semibold text-[var(--pl-text)]">
                        {formatPrice(minPrice, currency)}
                      </span>
                      <span className="text-[10px] text-[var(--pl-text-subtle)]">
                        from <strong>{bestListing.storeName}</strong>
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-[var(--pl-text-muted)]">No offers yet</span>
                  )}
                </div>
              </div>

              {/* BACK SIDE */}
              <div className="absolute inset-0 p-4 flex flex-col justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <h4 className="text-[11px] font-semibold text-[var(--pl-text)] mb-2">
                  Top offers
                </h4>
                {product.listings?.length > 0 ? (
                  <>
                    {product.listings.slice(0, 3).map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between text-[11px] mb-1"
                      >
                        <span className="truncate text-[var(--pl-text-muted)]">{l.storeName}</span>
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
                    No listings for this product.
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