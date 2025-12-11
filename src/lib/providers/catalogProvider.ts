// src/lib/providers/catalogProvider.ts
import type { ProductProvider, ProviderSearchResult } from "./types";
import type { IngestPayload, IngestProductInput } from "@/lib/ingestService";
import { prisma } from "@/lib/db";

async function buildCatalogProductsForQuery(query: string): Promise<IngestProductInput[]> {
  const normalized = query.trim();

  const products = await (prisma as any).curatedProduct.findMany({
    where: {
      OR: [
        { category: { contains: normalized, mode: "insensitive" } },
        { name: { contains: normalized, mode: "insensitive" } },
        { description: { contains: normalized, mode: "insensitive" } },
      ],
    },
    include: {
      listings: true,
    },
  });

  if (!products.length) return [];

  return products.map((p: any) => {
    const imageUrl = p.imageUrl ?? null;

    return {
      id: p.id,
      name: p.name,
      displayName: p.name,
      description: p.description ?? null,
      category: p.category,
      imageUrl,
      thumbnailUrl: imageUrl,
      listings: p.listings.map((l: any) => ({
        storeName: l.storeName,
        url: l.url,
        price: l.price,
        currency: l.currency,
        shippingCost: l.shippingCost ?? null,
      })),
    } as IngestProductInput;
  });
}

async function searchCatalogWithStatus(query: string): Promise<ProviderSearchResult> {
  const normalized = query.trim();

  if (!normalized) {
    return { payloads: [] };
  }

  try {
    const products = await buildCatalogProductsForQuery(normalized);
    const payload: IngestPayload = products;
    return {
      payloads: products.length > 0 ? [payload] : [],
    };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[catalogProvider] Failed to fetch curated products:", message, error);
    return {
      payloads: [],
      error: {
        type: "unknown",
        message,
      },
    };
  }
}

export const catalogProvider: ProductProvider = {
  name: "catalog",

  async searchProducts(query: string): Promise<IngestPayload[]> {
    const result = await searchCatalogWithStatus(query);
    return result.payloads;
  },

  async searchProductsWithStatus(query: string): Promise<ProviderSearchResult> {
    return searchCatalogWithStatus(query);
  },
};
