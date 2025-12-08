import { STATIC_PRODUCTS } from "@/data/staticProducts";
import type { IngestPayload, IngestProductInput } from "@/lib/ingestService";
import type { ProductProvider } from "./types";

function filterStaticProducts(query: string): IngestProductInput[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return STATIC_PRODUCTS;
  }

  return STATIC_PRODUCTS.filter((p) => {
    const haystack = (
      (p.name ?? "") +
      " " +
      (p.displayName ?? "") +
      " " +
      (p.description ?? "") +
      " " +
      (p.category ?? "") +
      " " +
      (p.brand ?? "")
    ).toLowerCase();

    return haystack.includes(normalized);
  });
}

export const staticProvider: ProductProvider = {
  name: "static",
  async searchProducts(query: string): Promise<IngestPayload[]> {
    const matched = filterStaticProducts(query).map((p) => {
      if (!Array.isArray(p.listings)) return p;

      return {
        ...p,
        listings: p.listings.map((l) => ({
          ...l,
          source: (l as any).source ?? "static",
        })),
      } satisfies IngestProductInput;
    });

    const payload: IngestPayload = matched as IngestProductInput[];
    return [payload];
  },
};
