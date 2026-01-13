// src/lib/ebayFeed.ts

export type EbayItem = {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  url: string;
};

export async function fetchEbayItems(query: string, limit = 20): Promise<EbayItem[]> {
  const res = await fetch(`/api/feeds/ebay?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to load eBay items: ${res.status}`);
  }
  const data = await res.json();
  const summaries = data.itemSummaries ?? [];
  return summaries.map((item: any) => ({
    id: item.itemId,
    title: item.title,
    price: item.price?.value ? Number(item.price.value) : 0,
    currency: item.price?.currency ?? "USD",
    imageUrl: item.thumbnailImages?.[0]?.imageUrl,
    url: item.itemWebUrl,
  }));
}
