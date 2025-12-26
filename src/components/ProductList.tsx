"use client";

import React from "react";
import type { StoreId } from "@/config/catalog";

type Listing = {
  id: string;
  storeId?: StoreId | string;
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

interface ProductListProps {
  products: Product[];
  selectedProductId: string | null;
  onSelectProduct: (id: string) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
}

function getBestListing(listings: Listing[] | undefined): Listing | null {
  if (!listings || listings.length === 0) return null;

  return listings.reduce<Listing | null>((best, l) => {
    if (!best) return l;
    if (l.price < best.price) return l;
    return best;
  }, null);
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  selectedProductId,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
}) => {
  if (!products.length) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const isSelected = product.id === selectedProductId;
        const isFavorite = favoriteIds.includes(product.id);
        const bestListing = getBestListing(product.listings);
        const offerCount = product.listings?.length ?? 0;

        const cardClasses = [
          "group relative flex flex-col justify-between rounded-2xl border bg-[var(--pl-card)] border-[var(--pl-card-border)] px-3.5 py-3 text-left transition-all",
          "hover:shadow-[0_0_18px_rgba(0,0,0,0.08)] hover:border-[var(--pl-primary)]",
          isSelected ? "ring-1 ring-[var(--pl-primary)] shadow-[0_0_22px_var(--pl-primary-glow)]" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelectProduct(product.id)}
            className={cardClasses}
          >
            {/* Header: name + brand */}
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <h3 className="text-[12px] font-semibold text-[var(--pl-text)] leading-snug line-clamp-2">
                  {product.displayName || product.name}
                </h3>
                {product.brand && (
                  <p className="mt-0.5 text-[10px] text-[var(--pl-text-subtle)]">
                    {product.brand}
                  </p>
                )}
              </div>

              {/* Favorite star */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(product.id);
                }}
                className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--pl-card-border)] bg-[var(--pl-bg)] text-[10px] text-[var(--pl-text-subtle)] hover:text-yellow-400 hover:border-yellow-400 transition-colors"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? "★" : "☆"}
              </button>
            </div>

            {/* Center: price & store */}
            <div className="mt-2">
              {bestListing ? (
                <>
                  <div className="inline-flex items-center gap-1 rounded-full bg-[var(--pl-primary-soft)] px-2 py-0.5 text-[9px] font-medium text-[var(--pl-primary-strong)]">
                    Best price
                    {bestListing.fastDelivery && (
                      <span className="ml-1 rounded-full bg-[var(--pl-primary)] px-1 py-[1px] text-[8px] text-white">
                        Fast
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[15px] font-semibold text-[var(--pl-text)] leading-none">
                      {bestListing.price.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-[var(--pl-text-subtle)] leading-none">
                      {bestListing.currency}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--pl-text-subtle)] leading-snug line-clamp-2">
                    from{" "}
                    <span className="font-medium text-[var(--pl-text)]">
                      {bestListing.storeName}
                    </span>
                    {offerCount > 1 && ` · ${offerCount} offers`}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[10px] text-[var(--pl-text-subtle)]">
                  No price available yet.
                </p>
              )}
            </div>

            {/* Bottom: small meta row */}
            <div className="mt-3 flex items-center justify-between text-[9px] text-[var(--pl-text-subtle)]">
              <span>
                {product.listings?.some((l) => l.inStock === false)
                  ? "Some offers out of stock"
                  : "In stock at listed stores"}
              </span>
              <span className="rounded-full border border-[var(--pl-card-border)] px-2 py-[2px] text-[9px]">
                View details
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ProductList;