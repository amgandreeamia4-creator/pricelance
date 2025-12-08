"use client";

import React from "react";
import type { ProductWithHistory } from "@/types/product";

type ProductWithBestOffers = ProductWithHistory & {
  bestOffers?: {
    cheapest?: any;
    fastest?: any;
    bestOverall?: any;
  };
};

type Props = {
  product: ProductWithBestOffers | null;
  selectedProductId: string | null;
  totalProducts?: number;
  totalOffers?: number;
};

type SummaryPick = {
  label: string;
  subtitle: string;
  storeName: string | null;
  price: number | null;
  currency: string | null;
  deliveryTimeDays: number | null;
};

function getTotalPrice(p: { price?: number | null; shippingCost?: number | null }) {
  const price = typeof p.price === "number" ? p.price : 0;
  const shipping = typeof p.shippingCost === "number" ? p.shippingCost : 0;
  return price + shipping;
}

function pickFromListing(label: string, subtitle: string, listing: any): SummaryPick | null {
  if (!listing) return null;

  const price = typeof listing.price === "number" ? listing.price : null;
  const currency = (listing as any).currency ?? "USD";
  const storeName = (listing as any).storeName ?? null;
  const deliveryTimeDays =
    (listing as any).deliveryDays ??
    (listing as any).estimatedDeliveryDays ??
    (listing as any).deliveryTimeDays ??
    null;

  return {
    label,
    subtitle,
    storeName,
    price,
    currency,
    deliveryTimeDays,
  };
}

function buildPicks(product: ProductWithBestOffers | null): SummaryPick[] {
  if (!product || !Array.isArray(product.listings) || product.listings.length === 0) {
    return [];
  }

  const listings = product.listings;

  const backendBest = (product as any).bestOffers as
    | { cheapest?: any; fastest?: any; bestOverall?: any }
    | undefined;

  let cheapest = backendBest?.cheapest;
  let fastest = backendBest?.fastest;
  let bestOverall = backendBest?.bestOverall;

  if (!backendBest) {
    // Fallback to frontend-derived picks when backend data is not present
    cheapest = [...listings].sort((a, b) => getTotalPrice(a) - getTotalPrice(b))[0];

    fastest = [...listings]
      .filter(
        (l) =>
          typeof (l as any).deliveryTimeDays === "number" ||
          typeof (l as any).estimatedDeliveryDays === "number"
      )
      .sort((a, b) => {
        const da =
          (a as any).deliveryTimeDays ??
          (a as any).estimatedDeliveryDays ??
          Number.POSITIVE_INFINITY;
        const db =
          (b as any).deliveryTimeDays ??
          (b as any).estimatedDeliveryDays ??
          Number.POSITIVE_INFINITY;
        return da - db;
      })[0];

    bestOverall = cheapest ?? listings[0];
  }

  if (!bestOverall && cheapest) {
    bestOverall = cheapest;
  }

  const picks: SummaryPick[] = [];

  const bestOverallPick = pickFromListing("BEST OVERALL", "Balanced choice", bestOverall);
  if (bestOverallPick) {
    picks.push(bestOverallPick);
  }

  if (cheapest && cheapest !== bestOverall) {
    const cheapestPick = pickFromListing(
      "CHEAPEST OVERALL",
      "Lowest total cost",
      cheapest
    );
    if (cheapestPick) picks.push(cheapestPick);
  }

  if (fastest && fastest !== bestOverall && fastest !== cheapest) {
    const fastestPick = pickFromListing("FASTEST DELIVERY", "Speed first", fastest);
    if (fastestPick) picks.push(fastestPick);
  }

  return picks;
}

const ProductSummary: React.FC<Props> = ({
  product,
  totalProducts,
  totalOffers,
}) => {
  const picks = buildPicks(product);

  const hasOverview =
    typeof totalProducts === "number" && typeof totalOffers === "number";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Best options for this product
        </h2>
        {product && (
          <div className="max-w-[60%] truncate text-[11px] text-slate-500 dark:text-slate-400 text-right">
            {product.displayName ?? product.name}
          </div>
        )}
      </div>

      {hasOverview && (
        <p className="mb-3 text-[11px] text-slate-600 dark:text-slate-400">
          Found{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-50">{totalProducts}</span>{" "}
          product{totalProducts === 1 ? "" : "s"} with{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-50">{totalOffers}</span>{" "}
          offer{totalOffers === 1 ? "" : "s"}.
        </p>
      )}

      {!product ? (
        <div className="text-sm text-slate-700 dark:text-slate-300">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            No product selected
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Select a product from the list to see the best options.
          </p>
        </div>
      ) : picks.length === 0 ? (
        <div className="text-sm text-slate-700 dark:text-slate-300">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            No offers available
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            This product doesn't have any offers with price or delivery information yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {picks.map((p, index) => (
            <div
              key={`${p.storeName ?? "store"}-${p.price ?? "na"}-${
                p.deliveryTimeDays ?? "na"
              }-${index}`}
              className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-400"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {p.label}
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300">{p.subtitle}</div>

              <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                {p.price != null ? (
                  <>
                    {p.price.toFixed(2)} {p.currency ?? "USD"}
                  </>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">Price not available</span>
                )}
              </div>

              <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                {p.storeName ? (
                  <>at <span className="font-medium text-slate-900 dark:text-slate-100">{p.storeName}</span></>
                ) : (
                  "Store not specified"
                )}
              </div>

              <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                {typeof p.deliveryTimeDays === "number" ? (
                  <>
                    Est. delivery:{" "}
                    <span className="font-medium text-slate-200">
                      {p.deliveryTimeDays} day
                      {p.deliveryTimeDays === 1 ? "" : "s"}
                    </span>
                  </>
                ) : (
                  "Delivery time not available"
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductSummary;