// src/components/DealList.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { DealDto } from "@/lib/dealsClient";

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

type DealListProps = {
  deals: DealDto[];
  loading?: boolean;
  error?: string | null;
};

type SortMode = "discount" | "price";

export default function DealList({ deals, loading, error }: DealListProps) {
  const [sortMode, setSortMode] = useState<SortMode>("discount");
  const [fastOnly, setFastOnly] = useState(false);

  // Loading state – subtle skeleton cards
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="h-3 w-40 rounded-full bg-slate-200" />
              <div className="h-4 w-16 rounded-full bg-slate-200" />
            </div>
            <div className="mt-2 h-3 w-28 rounded-full bg-slate-200" />
            <div className="mt-3 flex items-center gap-3">
              <div className="h-5 w-24 rounded-full bg-slate-200" />
              <div className="h-4 w-20 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <div className="font-semibold text-[13px]">Could not load deals</div>
        <div className="mt-1 text-xs text-red-100/80">{error}</div>
      </div>
    );
  }

  // Base "no deals at all" state
  if (!deals.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
        <div className="font-medium text-sky-700">
          No great deals to highlight right now
        </div>
        <div className="mt-1 text-xs text-slate-600 space-y-1">
          <p>
            We only show a deal when a product’s current price is clearly lower than
            its usual price.
          </p>
          <p>
            As we see more real prices over time, this section will start to fill
            with genuine deals instead of guesses.
          </p>
        </div>
      </div>
    );
  }

  const processedDeals = useMemo(() => {
    let list = [...deals];

    if (fastOnly) {
      list = list.filter((deal) => deal.bestListing?.fastDelivery === true);
    }

    if (sortMode === "discount") {
      list.sort((a, b) => {
        const aDisc =
          typeof a.discountPercent === "number" ? a.discountPercent : -Infinity;
        const bDisc =
          typeof b.discountPercent === "number" ? b.discountPercent : -Infinity;

        if (aDisc === bDisc) {
          const aPrice = a.currentPrice ?? Number.POSITIVE_INFINITY;
          const bPrice = b.currentPrice ?? Number.POSITIVE_INFINITY;
          return aPrice - bPrice;
        }

        // Bigger discount first; items without discount go last.
        return bDisc - aDisc;
      });
    } else {
      // sortMode === "price"
      list.sort((a, b) => {
        const aPrice = a.currentPrice ?? Number.POSITIVE_INFINITY;
        const bPrice = b.currentPrice ?? Number.POSITIVE_INFINITY;
        return aPrice - bPrice;
      });
    }

    return list;
  }, [deals, sortMode, fastOnly]);

  const hasFastFilterButEmpty = fastOnly && processedDeals.length === 0;

  return (
    <div className="space-y-3">
      {/* Controls: sort + fast-delivery filter */}
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="inline-flex items-center gap-1">
          <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
            Sort deals
          </span>
          <div className="inline-flex rounded-full bg-slate-100 border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => setSortMode("discount")}
              className={`px-2.5 py-0.5 rounded-full text-[11px] transition-colors ${
                sortMode === "discount"
                  ? "bg-teal-500/10 text-teal-700 border border-teal-500/70"
                  : "text-slate-600 border border-transparent hover:border-slate-300"
              }`}
            >
              Best discount
            </button>
            <button
              type="button"
              onClick={() => setSortMode("price")}
              className={`ml-1 px-2.5 py-0.5 rounded-full text-[11px] transition-colors ${
                sortMode === "price"
                  ? "bg-teal-500/10 text-teal-700 border border-teal-500/70"
                  : "text-slate-600 border border-transparent hover:border-slate-300"
              }`}
            >
              Lowest price
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFastOnly((prev) => !prev)}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
            fastOnly
              ? "border-teal-500/70 bg-teal-50 text-teal-700"
              : "border-slate-300 bg-white text-slate-700 hover:border-teal-400 hover:text-teal-700"
          }`}
        >
          <span
            className={`h-3 w-3 rounded-full border ${
              fastOnly
                ? "border-teal-500 bg-teal-500 shadow-[0_0_6px_rgba(45,212,191,0.7)]"
                : "border-slate-400 bg-white"
            }`}
          />
          <span>Fast delivery only</span>
        </button>
      </div>

      {hasFastFilterButEmpty ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
          No fast-delivery deals right now. Try turning off the filter or
          checking back later.
        </div>
      ) : (
        <ul className="space-y-3">
          {processedDeals.map((deal) => {
            const badgeColor =
              deal.provider === "dummyjson"
                ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-400/60"
                : deal.provider === "demo"
                ? "bg-sky-50 text-sky-700 border-sky-400/60"
                : "bg-emerald-50 text-emerald-700 border-emerald-400/60";

            const discountLabel =
              typeof deal.discountPercent === "number"
                ? `${Math.round(deal.discountPercent)}%`
                : "";

            const currency = deal.bestListing?.currency || "RON";

            const shippingCost = deal.bestListing?.shippingCost;
            const shippingText =
              typeof shippingCost === "number"
                ? shippingCost === 0
                  ? "Shipping: free"
                  : `Shipping: ${shippingCost.toFixed(2)} ${currency}`
                : null;

            const storeName = deal.bestListing?.storeName ?? "";
            const storeUrl = deal.bestListing?.url ?? null;

            const storeNode = storeUrl ? (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-900 underline-offset-2 hover:underline hover:text-teal-700"
              >
                {storeName}
              </a>
            ) : (
              <span className="font-semibold text-slate-900">{storeName}</span>
            );

            return (
              <li
                key={deal.productId + (deal.bestListing?.id ?? "")}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Top row: product + discount badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {deal.productName}
                      </h3>
                      {discountLabel &&
                        typeof deal.avgHistoricalPrice === "number" && (
                          <span className="inline-flex items-center rounded-full bg-teal-500/15 px-2 py-0.5 text-[11px] font-medium text-teal-300 border border-teal-500/40">
                            -{discountLabel} vs usual price
                          </span>
                        )}
                      {deal.provider && (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${badgeColor}`}
                        >
                          {deal.provider}
                        </span>
                      )}
                    </div>

                    {/* Brand / category */}
                    <div className="mt-1 text-[11px] text-slate-600 flex flex-wrap gap-2">
                      {deal.brand && <span>{deal.brand}</span>}
                      {deal.category && (
                        <span className="text-slate-500">· {deal.category}</span>
                      )}
                    </div>

                    {/* Price & historical info */}
                    {deal.bestListing && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-semibold text-emerald-700">
                            {deal.currentPrice.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-emerald-700/80">
                            {currency}
                          </span>
                        </div>

                        {typeof deal.avgHistoricalPrice === "number" && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="line-through text-slate-500">
                              {deal.avgHistoricalPrice.toFixed(2)} {currency}
                            </span>
                            {discountLabel && (
                              <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
                                -{discountLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Store / shipping / speed */}
                    {deal.bestListing && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                        <span>at {storeNode}</span>
                        {shippingText && (
                          <span className="text-slate-400">· {shippingText}</span>
                        )}
                        {deal.bestListing.fastDelivery && (
                          <span className="ml-1 inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] text-teal-700">
                            Fast delivery
                          </span>
                        )}
                        {deal.bestListing.source && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-teal-700 ring-1 ring-teal-400/60">
                            {deal.bestListing.source === "ebay" && "eBay"}
                            {deal.bestListing.source === "static" && "Catalog"}
                            {deal.bestListing.source === "dummyjson" && "Demo"}
                            {!["ebay", "static", "dummyjson"].includes(
                              deal.bestListing.source
                            ) && deal.bestListing.source}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-end sm:justify-center">
                    {deal.bestListing?.url && !isDemoUrl(deal.bestListing.url) ? (
                      <a
                        href={deal.bestListing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-teal-600 px-3 py-1 text-[11px] font-medium text-white ring-1 ring-teal-600 transition hover:bg-teal-700 whitespace-nowrap"
                      >
                        View deal
                        <span className="ml-1 text-[10px] opacity-80">↗</span>
                      </a>
                    ) : (
                      <div className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[10px] text-slate-600 whitespace-nowrap">
                        Demo – no store link
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
