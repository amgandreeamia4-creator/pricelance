import type { IngestPayload } from "@/lib/ingestService";
import type { ProductProvider } from "./types";

// Types based on DummyJSON response
type DummyJsonProduct = {
  id: number;
  title: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  rating: number;
  stock: number;
  thumbnail: string;
  images: string[];
};

type DummyJsonResponse = {
  products: DummyJsonProduct[];
  total: number;
  skip: number;
  limit: number;
};

async function fetchDummyJsonProducts(
  query: string,
  limit: number
): Promise<DummyJsonProduct[]> {
  const safeLimit =
    Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 100;

  const baseUrl = "https://dummyjson.com/products";

  const url = query.trim()
    ? `${baseUrl}/search?q=${encodeURIComponent(query.trim())}&limit=${safeLimit}`
    : `${baseUrl}?limit=${safeLimit}`;

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `DummyJSON upstream error ${response.status} ${response.statusText}: ${text}`
    );
  }

  const data = (await response.json()) as DummyJsonResponse;
  return data.products ?? [];
}

function mapToIngestPayload(products: DummyJsonProduct[]): IngestPayload {
  return products.map((p) => {
    const imageUrl = p.images?.[0] ?? p.thumbnail ?? null;
    const thumbnailUrl = p.thumbnail ?? imageUrl ?? null;
    const productId = `dummyjson-${p.id}`;

    return {
      id: productId,
      name: p.title,
      displayName: p.title,
      description: p.description,
      category: p.category ?? "Other",
      brand: p.brand ?? "DummyJSON",
      imageUrl,
      thumbnailUrl,
      listings: [
        {
          id: `${productId}-main`,
          storeName: "DummyJSON",
          url: `https://dummyjson.com/products/${p.id}`,
          imageUrl,
          price: p.price,
          currency: "USD",
          shippingCost: 0,
          deliveryTimeDays: 5,
          fastDelivery: true,
          location: "Online",
          inStock: p.stock > 0,
          rating: p.rating,
          reviewCount: p.stock,
          source: "dummyjson",
        },
      ],
      priceHistory: [
        {
          date: new Date(),
          price: p.price,
          currency: "USD",
          storeName: "DummyJSON",
        },
      ],
    };
  });
}

export const dummyJsonProvider: ProductProvider = {
  name: "dummyjson",
  async searchProducts(
    query: string,
    options?: { limit?: number }
  ): Promise<IngestPayload[]> {
    const limit = options?.limit ?? 100;
    const products = await fetchDummyJsonProducts(query, limit);
    const payload = mapToIngestPayload(products);
    return [payload];
  },
};
