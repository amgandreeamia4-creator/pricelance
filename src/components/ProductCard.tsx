'use client';

type Props = {
  product: {
    name: string;
    imageUrl?: string;
    listings: {
      price: number;
      currency: string;
    }[];
  };
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
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition-transform transform hover:scale-[1.02] hover:shadow-lg ${
        isSelected
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-slate-800 bg-slate-900/70 hover:border-slate-600'
      }`}
    >
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-16 w-16 object-contain"
        />
      )}
      <div className="flex flex-col justify-start gap-1 text-start">
        <div className="line-clamp-2 text-[13px] font-medium leading-snug">
          {product.name}
        </div>
        <div className="text-[13px] font-semibold text-white">
          {minPrice} {currency}
        </div>
      </div>
    </button>
  );
}