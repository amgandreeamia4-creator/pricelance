// src/components/ProductList.tsx
"use client";

import React from "react";
import Image from "next/image";

type Listing = {
  id: string;
  storeName: string;
  storeLogoUrl?: string | null;
  price: number;
  currency: string;
  url?: string | null;
  fastDelivery?: boolean | null;
  deliveryDays?: number | null;
  inStock?: boolean | null;
};

type Product = {
  id: string;
  name: string;
  displayName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  listings: Listing[];
};

interface Props {
  products: Product[];
  selectedProductId?: string | null;
  onSelectProduct?: (id: string) => void;
}

function isValidImageUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export default function ProductList({ products, selectedProductId, onSelectProduct }: Props) {
  if (!products?.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const listings = Array.isArray(product.listings) ? product.listings : [];

        const isSelected =
          selectedProductId != null && selectedProductId === product.id;

        return (
          <div
            key={product.id}
            onClick={() => onSelectProduct?.(product.id)}
            className={
              "rounded-xl border border-[var(--pl-card-border)] bg-[var(--pl-card)] p-3 shadow-sm transition hover:border-blue-500/50 " +
              (isSelected ? "border-blue-400 ring-2 ring-blue-500/40" : "")
            }
          >
            {/* Product Image */}
            <div className="relative mb-3 h-36 w-full overflow-hidden rounded-lg bg-[var(--pl-bg)]">
              {isValidImageUrl(product.imageUrl) ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-[var(--pl-text-subtle)]">
                  No image
                </div>
              )}
            </div>

            {/* Name */}
            <h3 className="mb-2 line-clamp-2 text-[13px] font-semibold text-[var(--pl-text)]">
              {product.displayName || product.name}
            </h3>

            {/* Listings */}
            <div className="space-y-1.5">
              {listings.map((l) => (
                <a
                  key={l.id}
                  href={l.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-[var(--pl-card-border)] bg-[var(--pl-bg)] px-2.5 py-1.5 text-[11px] transition hover:border-blue-500/50"
                >
                  <div className="flex items-center gap-2">
                    {isValidImageUrl(l.storeLogoUrl) ? (
                      <Image
                        src={l.storeLogoUrl}
                        alt={l.storeName}
                        width={16}
                        height={16}
                        className="rounded-sm"
                        unoptimized
                      />
                    ) : (
                      <div className="h-4 w-4 rounded bg-[var(--pl-card-border)]" />
                    )}
                    <span className="text-[var(--pl-text-muted)]">{l.storeName}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-semibold text-blue-400">
                      {l.price} {l.currency}
                    </span>

                    {l.fastDelivery && (
                      <div className="text-[9px] text-emerald-400">
                        Fast delivery
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}