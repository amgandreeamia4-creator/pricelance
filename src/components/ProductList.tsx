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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const isSelected = selectedProductId === product.id;
        const bestListing = getBestListing(product.listings);
        const isFavorite = favoriteIds.includes(product.id);

        const cardBase =
          "relative flex h-full flex-col rounded-2xl border bg-[var(--pl-card)] border-[var(--pl-card-border)] transition-all cursor-pointer";
        const cardSelected =
          "ring-1 ring-[var(--pl-primary)] shadow-[0_0_18px_var(--pl-primary-glow)]";
        const cardHover =
          "hover:border-[var(--pl-primary)] hover:shadow-[0_0_15px_var(--pl-primary-glow)]";

        return (
          <div
            key={product.id}
            role="button"
            tabIndex={0}
            className={`${cardBase} ${cardHover} ${
              isSelected ? cardSelected : ""
            }`}
            onClick={() => onSelectProduct(product.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectProduct(product.id);
              }
            }}
          >
            <div className="flex flex-1 gap-3 p-3">
              {/* Image */}
              <div className="flex-shrink-0 w-[64px] h-[64px] rounded-xl bg-[var(--pl-bg)] border border-[var(--pl-card-border)] flex items-center justify-center text-[10px] text-[var(--pl-text-subtle)] overflow-hidden">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.displayName || product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span>No img</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[12px] font-medium text-[var(--pl-text)] leading-snug line-clamp-2">
                      {product.displayName || product.name}
                    </h3>
                    {product.brand && (
                      <p className="mt-0.5 text-[11px] text-[var(--pl-text-subtle)]">
                        {product.brand}
                      </p>
                    )}
                  </div>

                  {/* Favorite star */}
                  <button
                    type="button"
                    aria-label={
                      isFavorite
                        ? "Remove from favourites"
                        : "Add to favourites"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(product.id);
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] transition-colors ${
                      isFavorite
                        ? "bg-[var(--pl-primary)] text-white border-[var(--pl-primary)] shadow-[0_0_12px_var(--pl-primary-glow)]"
                        : "bg-[var(--pl-bg)] text-[var(--pl-text-subtle)] border-[var(--pl-card-border)] hover:text-[var(--pl-primary)] hover:border-[var(--pl-primary)]"
                    }`}
                  >
                    ★
                  </button>
                </div>

                {/* Price row */}
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  {bestListing ? (
                    <>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[var(--pl-text-subtle)]">
                          Best price
                        </span>
                        <span className="text-[13px] font-semibold text-[var(--pl-text)]">
                          {formatPrice(
                            bestListing.price,
                            bestListing.currency,
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-[var(--pl-text-subtle)]">
                          at{" "}
                          <span className="font-medium">
                            {bestListing.storeName}
                          </span>
                        </p>
                        <p className="text-[10px] text-[var(--pl-text-subtle)]">
                          {product.listings.length} offers
                        </p>
                      </div>
                    </>
                  ) : (
                    <span className="text-[11px] text-[var(--pl-text-subtle)]">
                      No offers available yet.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom ribbon for “highlight” */}
            {bestListing && (
              <div className="flex items-center justify-between px-3 pb-2 pt-1 text-[10px] text-[var(--pl-text-subtle)] border-t border-[var(--pl-card-border)] bg-[color-mix(in_srgb,var(--pl-card)_88%,var(--pl-primary)_12%)]">
                <span className="uppercase tracking-[0.12em] font-semibold">
                  Highlight
                </span>
                <span>
                  From{" "}
                  <span className="font-medium">
                    {bestListing.storeName}
                  </span>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;