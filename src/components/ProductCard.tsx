'use client';

import type { ProductWithHistory } from '../types/product';

type Props = {
  product: ProductWithHistory;
  isSelected: boolean;
  onSelect: () => void;
};

export default function ProductCard({ product, isSelected, onSelect }: Props) {
  const listings = product.listings;
  const minPrice = Math.min(...listings.map((l: { price: number }) => l.price));
  const currency = listings[0]?.currency ?? 'RON';
  const source = listings[0]?.source ?? 'Affiliate';
  const storeLogoUrl = listings[0]?.storeLogoUrl;
  const storeName = listings[0]?.store || listings[0]?.storeName || 'Affiliate';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition-transform transform hover:scale-[1.02] hover:shadow-lg h-24 overflow-hidden ${
        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-800 bg-slate-900/70 hover:border-slate-600'
      }`}
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-16 w-16 object-contain flex-shrink-0"
        />
      ) : null}

      <div className="flex flex-col justify-between flex-1 min-w-0 h-full">
        <div className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
          {product.name}
        </div>

        <div className="price-affiliate-wrapper flex flex-col items-start gap-1">
          <span className="product-price text-sm font-bold text-black whitespace-nowrap">
            {minPrice} {currency}
          </span>
          <div className="flex items-center gap-1">
            {storeLogoUrl ? (
              <img
                src={storeLogoUrl}
                alt={storeName}
                title={storeName}
                className="h-3 w-3 object-contain flex-shrink-0"
              />
            ) : (
              <div className="inline-flex max-w-[140px] items-center justify-center rounded-full bg-neutral-50 px-3 py-1">
                <span
                  className="truncate text-[11px] font-medium text-neutral-700"
                  title={storeName}
                >
                  {storeName}
                </span>
              </div>
            )}
            <span className="affiliate-label text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded uppercase whitespace-nowrap">
              Affiliate
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}