"use client";

import React from "react";

type Listing = {
  id: string;
  storeId?: string;
  storeName: string;
  storeLogoUrl?: string | null;
  price: number;
  currency: string;
  url?: string | null;
  fastDelivery?: boolean | null;
  deliveryDays?: number | null;
  inStock?: boolean | null;
  deliveryTimeDays?: number | null;
  source?: string | null;
  affiliateProvider?: string | null;
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

function formatPrice(price: number | undefined, currency: string | undefined) {
  if (price == null || !Number.isFinite(price)) return "No price";
  const c = currency || "";
  return `${price.toFixed(2)} ${c}`.trim();
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
    <div className="relative">
      {/* horizontal rail */}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4">
        {products.map((product) => {
          const isSelected = selectedProductId === product.id;
          const bestListing = getBestListing(product.listings);
          const isFavorite = favoriteIds.includes(product.id);

          const minPrice = bestListing?.price;
          const currency = bestListing?.currency ?? "LEI";
          const isAffiliate = Boolean(
            bestListing?.affiliateProvider || bestListing?.source,
          );

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
              className={`flex-none w-64 rounded-2xl border border-[var(--pl-card-border)] bg-[var(--pl-card)]
                px-4 py-3 cursor-pointer transition-all
                hover:shadow-[0_0_20px_rgba(15,23,42,0.18)]
                ${
                  isSelected
                    ? "ring-2 ring-[var(--pl-primary)]"
                    : ""
                }`}
            >
              <div className="flex">
                {/* Image */}
                <div className="w-16 h-16 mr-3 shrink-0 rounded-xl bg-[var(--pl-bg)]/70 border border-[var(--pl-card-border)] overflow-hidden flex items-center justify-center">
                  <img
                    src={product.imageUrl || "/placeholder.png"}
                    alt={product.displayName || product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Text block */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--pl-text)] leading-snug line-clamp-2">
                      {product.displayName || product.name}
                    </h3>
                    {product.brand && (
                      <p className="mt-0.5 text-[10px] text-[var(--pl-text-subtle)] line-clamp-1">
                        {product.brand}
                      </p>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                    {bestListing ? (
                      <>
                        <span className="text-[var(--pl-text-muted)]">
                          from <strong>{bestListing.storeName}</strong>
                        </span>
                        {isAffiliate && (
                          <span className="rounded-full bg-[var(--pl-primary)]/10 text-[var(--pl-primary)] px-2 py-0.5 text-[9px]">
                            Affiliate
                          </span>
                        )}
                        {bestListing.fastDelivery && (
                          <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[9px]">
                            Fast delivery
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[var(--pl-text-muted)]">
                        No offers yet
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price + favourite in bottom-right */}
              <div className="mt-3 flex items-end justify-between">
                <div className="text-left">
                  {bestListing ? (
                    <>
                      <div className="text-[10px] text-[var(--pl-text-muted)]">
                        Best price
                      </div>
                      <div className="text-sm font-semibold text-[var(--pl-text)]">
                        {formatPrice(minPrice, currency)}
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-[var(--pl-text-muted)]">
                      No price
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  aria-label={
                    isFavorite ? "Remove from favourites" : "Add to favourites"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(product.id);
                  }}
                  className={`h-7 w-7 rounded-full border text-[11px] flex items-center justify-center transition-colors
                    ${
                      isFavorite
                        ? "bg-[var(--pl-primary)] text-white border-[var(--pl-primary)] shadow-[0_0_10px_var(--pl-primary-glow)]"
                        : "bg-[var(--pl-bg)]/80 text-[var(--pl-text-muted)] border-[var(--pl-card-border)] hover:text-[var(--pl-primary)] hover:border-[var(--pl-primary)]"
                    }`}
                >
                  ★
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;