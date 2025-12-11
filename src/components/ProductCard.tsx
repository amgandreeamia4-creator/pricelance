'use client';

import type { ProductWithHistory } from '../types/product';

type Props = {
  product: ProductWithHistory;
  isSelected: boolean;
  onSelect: () => void;
};

export function ProductCard({ product, isSelected, onSelect }: Props) {
  const listings = product.listings;
  const minPrice = Math.min(...listings.map((l) => l.price));
  const currency = listings[0]?.currency ?? 'EUR';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition ${
        isSelected
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-slate-800 bg-slate-900/70 hover:border-slate-600'
      }`}
    >
      <div className="h-14 w-20 overflow-hidden rounded-xl bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listings[0]?.imageUrl ?? product.imageUrl ?? product.thumbnailUrl ?? undefined}
          alt={product.displayName}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1">
        <p className="line-clamp-1 text-xs font-semibold text-slate-50 sm:text-sm">
          {product.displayName}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          From{' '}
          <span className="font-semibold text-slate-50">
            {minPrice.toFixed(0)} {currency}
          </span>{' '}
          · {listings.length} stores
        </p>
      </div>
    </button>
  );
}