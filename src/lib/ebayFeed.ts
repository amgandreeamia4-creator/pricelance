// src/lib/ebayFeed.ts

export type EbayItem = {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  url: string;
};

export async function fetchEbayItems(
  query: string,
  limit: number = 20
): Promise<EbayItem[]> {
  if (!query.trim()) return [];

  const res = await fetch(
    `/api/feeds/ebay?q=${encodeURIComponent(query)}&limit=${limit}` 
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ebay feed error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const summaries = data.itemSummaries ?? [];

  const items: EbayItem[] = summaries.map((item: any) => ({
    id: item.itemId,
    title: item.title,
    price: item.price?.value ? Number(item.price.value) : 0,
    currency: item.price?.currency ?? "USD",
    imageUrl: item.thumbnailImages?.[0]?.imageUrl,
    url: item.itemWebUrl,
  }));

  return items;
}
