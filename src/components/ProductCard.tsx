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
  const currency = listings[0]?.currency ?? 'EUR';
  const source = listings[0]?.source ?? 'Affiliate';
  const storeLogoUrl = listings[0]?.storeLogoUrl;
  const storeName = listings[0]?.store || listings[0]?.storeName || 'Affiliate';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition-transform transform hover:scale-[1.02] hover:shadow-lg ${
        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-800 bg-slate-900/70 hover:border-slate-600'
      }`}
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-16 w-16 object-contain"
        />
      ) : null}

      <div className="flex flex-col justify-start gap-1 text-start">
        <div className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
          {product.name}
        </div>

        <div className="price-section flex flex-col items-center gap-1 pt-2 w-full overflow-hidden text-center">
          <div className="price text-base font-bold text-black">
            {minPrice} {currency}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            {storeLogoUrl ? (
              <img
                src={storeLogoUrl}
                alt={storeName}
                title={storeName}
                className="h-3 object-contain"
              />
            ) : (
              <span className="font-medium">{storeName}</span>
            )}
            <div className="affiliate-badge bg-gray-200 px-1.5 py-0.5 rounded text-uppercase">
              affiliate
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}