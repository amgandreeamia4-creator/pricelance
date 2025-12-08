'use client';

import React from 'react';
import type { ProductWithHistory } from '@/types/product';
import { getBestListing } from '@/lib/productService';

/**
 * Check if a URL is a demo/placeholder URL that shouldn't be clickable.
 */
function isDemoUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    if (u.hostname === "example.com") return true;
    if (u.hostname === "dummyjson.com") return true;
    return false;
  } catch {
    return true;
  }
}

type Props = {
  products: ProductWithHistory[];
  selectedProductId: string | null;
  onSelectProduct: (id: string) => void;
  favoriteProductIds?: string[];
  onToggleFavorite?: (productId: string) => void;
};

const ProductList: React.FC<Props> = ({
  products,
  selectedProductId,
  onSelectProduct,
  favoriteProductIds,
  onToggleFavorite,
}) => {
  // Empty state if no products
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <div className="text-center">
          <div className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-100">
            No results found
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Try searching for a product above to see matching items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {products.map((product, index) => {
        const best = getBestListing(product);

        // Prefer actual product id when available; fall back to productId or index-based id.
        const realId = (product as any).id as string | undefined;
        const productId = realId ?? product.productId ?? `product-${index}`;
        const isSelected = selectedProductId === productId;
        const isFavorite =
          Array.isArray(favoriteProductIds) && favoriteProductIds.includes(productId);

        return (
          <div
            key={productId}
            onClick={() => onSelectProduct(productId)}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              isSelected
                ? 'border-emerald-400 bg-emerald-50 shadow-[0_0_18px_rgba(16,185,129,0.35)] dark:border-emerald-400 dark:bg-emerald-900/20'
                : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-400 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex flex-1 flex-col">
              {/* Title + deal badge */}
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {product.displayName ?? product.name}
                  </div>
                  {product.dealInfo?.isGreatDeal && (
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
                      Great price
                    </span>
                  )}
                </div>
              </div>

              {/* Brand + category */}
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {product.brand && <span className="mr-2">{product.brand}</span>}
                {product.category && <span>{product.category}</span>}
              </div>

              {/* Best listing summary */}
              {best && (
                <div className="mt-1 flex flex-col gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex flex-wrap items-center gap-2">
                    <div>
                      Best offer{' '}
                      <span className="font-semibold">
                        {best.price}
                        {typeof best.shippingCost === 'number'
                          ? ` + ${best.shippingCost}`
                          : ''}{' '}
                        {best.currency}
                      </span>{' '}
                      from{' '}
                      <span className="font-semibold">{best.store}</span>{' '}
                      {typeof best.deliveryTimeDays === 'number' && (
                        <>
                          (delivery ~{best.deliveryTimeDays} day
                          {best.deliveryTimeDays !== 1 ? 's' : ''})
                        </>
                      )}
                    </div>

                    {best.source && (
                      <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {best.source === 'ebay' && 'eBay'}
                        {best.source === 'static' && 'Catalog'}
                        {best.source === 'dummyjson' && 'Demo'}
                        {!['ebay', 'static', 'dummyjson'].includes(best.source) &&
                          best.source}
                      </span>
                    )}
                  </div>

                  {best.url && !isDemoUrl(best.url) ? (
                    <a
                      href={best.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-max items-center justify-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-400/60 transition hover:bg-emerald-500/20 hover:text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-400 dark:hover:bg-emerald-500/20"
                      onClick={(event) => {
                        // Don't interfere with parent card selection when following the link.
                        event.stopPropagation();
                      }}
                    >
                      View deal
                      <span className="ml-1 text-[10px] opacity-80">↗</span>
                    </a>
                  ) : (
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Demo product – no store link
                    </div>
                  )}
                </div>
              )}

              {product.dealInfo?.isGreatDeal && product.dealInfo.label && (
                <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-200/80">
                  {product.dealInfo.label}
                </div>
              )}
            </div>

            {onToggleFavorite && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite(productId);
                }}
                className={`ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs shadow-sm transition-colors ${
                  isFavorite
                    ? 'border-amber-400 bg-amber-400/10 text-amber-500 dark:border-amber-300 dark:bg-amber-500/20 dark:text-amber-100'
                    : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-amber-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-200'
                }`}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;