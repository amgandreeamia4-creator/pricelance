// src/lib/canonical.ts
// Canonical ingestion types and CSV row normalizer

export type SourceProvider = "profitshare" | "2performant" | "manual" | "unknown";

export type CanonicalListingInput = {
  externalId: string | null;
  productName: string;
  category: string | null;
  brand: string | null;
  imageUrl: string | null;

  listing: {
    storeName: string;
    url: string;
    price: number;
    currency: string;
    shippingCost?: number | null;
    inStock?: boolean | null;
  };

  sourceProvider: SourceProvider;
};

// Normalizer result
export type NormalizerResult =
  | { ok: true; canonical: CanonicalListingInput }
  | { ok: false; error: string };

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const normalized = s.replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
}

export function normalizeCsvRow(rawRow: Record<string, any>, provider: string): NormalizerResult {
  try {
    const p = (provider || "unknown").toLowerCase();

    if (p === "profitshare") {
      const productName = String(rawRow.name ?? rawRow.productName ?? "").trim();
      const price = toNumber(rawRow.price ?? rawRow.price_with_vat ?? rawRow[10]);
      const url = String(rawRow.affiliateUrl ?? rawRow.affiliate_link ?? rawRow.productUrl ?? "").trim();
      const currency = String(rawRow.currency ?? "RON").trim() || "RON";
      const storeName = String(rawRow.storeName ?? rawRow.advertiser ?? "Unknown").trim();

      if (!productName) return { ok: false, error: "Missing productName" };
      if (price == null || !Number.isFinite(price) || price <= 0)
        return { ok: false, error: "Invalid or missing price" };
      if (!url) return { ok: false, error: "Missing product URL / affiliate URL" };

      const canonical: CanonicalListingInput = {
        externalId: rawRow.sku ?? rawRow.externalId ?? null,
        productName,
        category: rawRow.categoryRaw ?? rawRow.category ?? null,
        brand: rawRow.brand ?? null,
        imageUrl: rawRow.imageUrl ?? null,
        listing: {
          storeName: storeName || "Unknown",
          url,
          price,
          currency,
          shippingCost: null,
          inStock: rawRow.availability ? String(rawRow.availability).toLowerCase().includes("in") : null,
        },
        sourceProvider: "profitshare",
      };

      return { ok: true, canonical };
    }

    if (p === "2performant" || p === "twoperformant") {
      const productName = String(rawRow.title ?? rawRow.productTitle ?? rawRow.name ?? "").trim();
      const price = toNumber(rawRow.price ?? rawRow.sale_price ?? rawRow[9]);
      const url = String(rawRow.affCode ?? rawRow.aff_code ?? rawRow.url ?? rawRow.affiliate_link ?? "").trim();
      const currency = String(rawRow.currency ?? "RON").trim() || "RON";
      const storeName = String(rawRow.storeName ?? rawRow.store_name ?? rawRow.campaignName ?? "Unknown").trim();

      if (!productName) return { ok: false, error: "Missing productName" };
      if (price == null || !Number.isFinite(price) || price <= 0)
        return { ok: false, error: "Invalid or missing price" };
      if (!url) return { ok: false, error: "Missing product URL / affiliate URL" };

      const canonical: CanonicalListingInput = {
        externalId: rawRow.externalId ?? rawRow.sku ?? null,
        productName,
        category: rawRow.categoryRaw ?? rawRow.category ?? null,
        brand: null,
        imageUrl: rawRow.imageUrls ?? rawRow.imageUrl ?? null,
        listing: {
          storeName: storeName || "Unknown",
          url,
          price,
          currency,
          shippingCost: null,
          inStock: rawRow.availability ? String(rawRow.availability).toLowerCase().includes("in") : null,
        },
        sourceProvider: "2performant",
      };

      return { ok: true, canonical };
    }

    // Generic / unknown provider mapping - best effort
    const productName = String(rawRow.productName ?? rawRow.product_title ?? rawRow.name ?? "").trim();
    const price = toNumber(rawRow.price ?? rawRow.price_cents ?? rawRow.listingPrice ?? rawRow[9]);
    const url = String(rawRow.url ?? rawRow.affiliateUrl ?? rawRow.productUrl ?? "").trim();
    const currency = String(rawRow.currency ?? "RON").trim() || "RON";
    const storeName = String(rawRow.storeName ?? rawRow.store_name ?? "Unknown").trim();

    if (!productName) return { ok: false, error: "Missing productName" };
    if (price == null || !Number.isFinite(price) || price <= 0)
      return { ok: false, error: "Invalid or missing price" };
    if (!url) return { ok: false, error: "Missing product URL / affiliate URL" };

    return {
      ok: true,
      canonical: {
        externalId: rawRow.externalId ?? rawRow.sku ?? null,
        productName,
        category: rawRow.category ?? null,
        brand: rawRow.brand ?? null,
        imageUrl: rawRow.imageUrl ?? null,
        listing: {
          storeName: storeName || "Unknown",
          url,
          price,
          currency,
          shippingCost: null,
          inStock: null,
        },
        sourceProvider: "unknown",
      },
    };
  } catch (err: any) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}

export default normalizeCsvRow;
