// src/lib/dealUtils.ts

export type DealInfo = {
  isGreatDeal: boolean;
  dealPercent: number | null;
  label: string | null;
};

type ListingLike = {
  price?: number | null;
  shippingCost?: number | null;
};

type HistoryLike = {
  price?: number | null;
};

export type ProductForDeal = {
  listings?: ListingLike[];
  priceHistory?: HistoryLike[];
};

export function computeDealInfo(product: ProductForDeal): DealInfo {
  const listings = product.listings ?? [];
  const history = product.priceHistory ?? [];

  if (!listings.length || !history.length) {
    return {
      isGreatDeal: false,
      dealPercent: null,
      label: null,
    };
  }

  // Current cheapest total (price + shipping)
  let currentCheapest = Number.POSITIVE_INFINITY;

  for (const l of listings) {
    const price =
      typeof l.price === "number" && !Number.isNaN(l.price) ? l.price : null;
    if (price == null) continue;

    const shipping =
      typeof l.shippingCost === "number" && !Number.isNaN(l.shippingCost)
        ? l.shippingCost
        : 0;

    const total = price + shipping;
    if (total < currentCheapest) {
      currentCheapest = total;
    }
  }

  if (!Number.isFinite(currentCheapest) || currentCheapest <= 0) {
    return {
      isGreatDeal: false,
      dealPercent: null,
      label: null,
    };
  }

  // Average historical price
  const prices: number[] = [];
  for (const h of history) {
    const p =
      typeof h.price === "number" && !Number.isNaN(h.price) ? h.price : null;
    if (p != null && p > 0) {
      prices.push(p);
    }
  }

  if (!prices.length) {
    return {
      isGreatDeal: false,
      dealPercent: null,
      label: null,
    };
  }

  const sum = prices.reduce((acc, p) => acc + p, 0);
  const avg = sum / prices.length;

  if (!(avg > 0)) {
    return {
      isGreatDeal: false,
      dealPercent: null,
      label: null,
    };
  }

  const diff = avg - currentCheapest;
  const percent = diff / avg; // e.g. 0.18 = 18% below avg

  // Threshold for "great deal"
  const THRESHOLD = 0.15; // 15% cheaper than usual

  if (percent >= THRESHOLD) {
    const percentDisplay = Math.round(percent * 100);
    const label = `≈ ${percentDisplay}% below usual price`;
    return {
      isGreatDeal: true,
      dealPercent: percent,
      label,
    };
  }

  return {
    isGreatDeal: false,
    dealPercent: percent,
    label: null,
  };
}
