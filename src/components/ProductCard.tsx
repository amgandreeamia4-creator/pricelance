'use client';

import type { ProductWithHistory } from '../types/product';

type Props = {
  product: ProductWithHistory;
  isSelected: boolean;
  onSelect: () => void;
};

export default function ProductCard({ product, isSelected, onSelect }: Props) {
  const listings = product.listings;
  const minPrice = Math.min(...listings.map((l) => l.price));
  const currency = listings[0]?.currency ?? 'EUR';
  const source = listings[0]?.source ?? 'Affiliate';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition-transform transform hover:scale-[1.02] hover:shadow-lg ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-300 hover:border-slate-400'
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
        <div className="line-clamp-2 text-[13px] font-medium text-foreground">
          {product.name}
        </div>
        <div className="text-[13px] font-semibold text-primary">
          {minPrice} {currency}
        </div>
        <div className="text-[12px] text-muted-foreground mt-1">
          from <span className="font-medium">{source}</span>{' '}
          <span className="opacity-60">(affiliate)</span>
        </div>
      </div>
    </button>
  );
}