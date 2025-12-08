// src/lib/dealsClient.ts

export type DealListing = {
  id: string;
  storeName: string;
  url: string | null;
  price: number;
  currency: string;
  shippingCost: number;
  fastDelivery: boolean;
  source?: string | null;
};

export type DealDto = {
  productId: string;
  productName: string;
  category: string | null;
  brand: string | null;
  provider: string | null;
  currentPrice: number;
  avgHistoricalPrice: number | null;
  discountPercent: number | null;
  bestListing: DealListing | null;
};

export async function fetchDeals(limit = 20): Promise<{
  ok: boolean;
  deals?: DealDto[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/deals?limit=${encodeURIComponent(limit)}`);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return {
        ok: false,
        error: data?.error ?? `Request failed with status ${res.status}`,
      };
    }
    const data = await res.json();
    return {
      ok: true,
      deals: (data.deals as DealDto[]) ?? [],
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message ?? "Unable to load deals.",
    };
  }
}
