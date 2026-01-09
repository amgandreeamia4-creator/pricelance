// src/lib/ingestService.ts
// =============================================================================
// LEGACY - DO NOT USE FOR NEW IMPORTS
// =============================================================================
//
// This file is DEPRECATED and retained only for reference/internal tooling.
// All production imports MUST use the core ingestion pipeline:
//   src/lib/importService.ts → importNormalizedListings()
//
// The current import architecture uses adapters that normalize data
// before calling the shared importNormalizedListings() function.
// See: src/lib/affiliates/googleSheet.ts for the active adapter.
//
// This legacy code bypasses the normalized adapter pattern and
// directly manipulates Product/Listing records. It may still be used
// by internal/demo routes but should NOT be used for affiliate feeds.
// =============================================================================

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

export type IngestListingInput = {
  id?: string;
  storeName?: string;
  url?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  shippingCost?: number;
  deliveryTimeDays?: number;
  estimatedDeliveryDays?: number;
  deliveryDays?: number;
  fastDelivery?: boolean;
  location?: string;
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  storeLogoUrl?: string | null;
  /** Optional internal provider/source tag, e.g. "static", "dummyjson", "ebay". */
  source?: string | null;
  [key: string]: any;
};

export type IngestPriceHistoryInput = {
  month?: string; // "YYYY-MM"
  date?: string | Date;
  averagePrice?: number;
  price?: number;
  currency?: string;
  storeName?: string | null;
  [key: string]: any;
};

export type IngestProductInput = {
  id?: string;
  name: string;
  displayName?: string;
  description?: string | null;
  category?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  listings?: IngestListingInput[];
  priceHistory?: IngestPriceHistoryInput[];
  [key: string]: any;
};

export type IngestPayload =
  | IngestProductInput[]
  | { products?: IngestProductInput[] | null };

export type IngestResult = {
  count: number;
  productIds: string[];
};

export function normalizeProducts(payload: IngestPayload): IngestProductInput[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.products)) return payload.products;
  return [];
}

export async function ingestProducts(payload: IngestPayload): Promise<IngestResult> {
  const products = normalizeProducts(payload);

  let count = 0;
  const productIds: string[] = [];

  for (const p of products) {
    try {
      // 1) Upsert / create product
      const baseData = {
        name: p.name,
        displayName: p.displayName ?? p.name,
        description: p.description ?? null,
        category: p.category ?? null,
        brand: p.brand ?? null,
        thumbnailUrl: p.thumbnailUrl ?? p.imageUrl ?? null,
        imageUrl: p.imageUrl ?? p.thumbnailUrl ?? null,
      };

      let product;
      if (p.id) {
        product = await prisma.product.upsert({
          where: { id: p.id },
          update: baseData,
          create: {
            id: p.id,
            ...baseData,
            updatedAt: new Date(),
          },
        });
      } else {
        product = await prisma.product.create({
          data: {
            ...baseData,
            updatedAt: new Date(),
          } as unknown as Prisma.ProductCreateInput,
        });
      }

      // 2) Listings: replace existing listings for this product
      if (Array.isArray(p.listings) && p.listings.length > 0) {
        await prisma.listing.deleteMany({ where: { productId: product.id } });

        for (const l of p.listings) {
          // Relax Prisma typing for new metadata fields
          await (prisma.listing.create as any)({
            data: {
              id: l.id ?? undefined,
              productId: product.id,

              storeName: l.storeName ?? "Unknown store",
              storeLogoUrl: l.storeLogoUrl ?? null,
              url: l.url ?? null,
              imageUrl: l.imageUrl ?? product.imageUrl ?? null,

              price: typeof l.price === "number" ? l.price : 0,
              priceCents:
                typeof l.price === "number" ? Math.round(l.price * 100) : 0,
              currency: l.currency ?? "USD",
              priceLastSeenAt:
                typeof l.price === "number" ? new Date() : null,

              shippingCost:
                typeof l.shippingCost === "number" ? l.shippingCost : null,

              deliveryTimeDays:
                l.deliveryTimeDays ??
                l.estimatedDeliveryDays ??
                l.deliveryDays ??
                null,

              fastDelivery:
                typeof l.fastDelivery === "boolean" ? l.fastDelivery : null,
              isFastDelivery:
                typeof l.fastDelivery === "boolean" ? l.fastDelivery : null,

              estimatedDeliveryDays: l.deliveryTimeDays ?? null,
              deliveryDays: l.deliveryTimeDays ?? null,

              location: l.location ?? null,
              inStock:
                typeof l.inStock === "boolean" ? l.inStock : true,

              rating: typeof l.rating === "number" ? l.rating : null,
              reviewCount:
                typeof l.reviewCount === "number" ? l.reviewCount : null,
              updatedAt: new Date(),
            },
          });
        }
      }

      // 3) Price history: replace for this product
      if (Array.isArray(p.priceHistory) && p.priceHistory.length > 0) {
        await prisma.productPriceHistory.deleteMany({
          where: { productId: product.id },
        });

        for (const h of p.priceHistory) {
          let date: Date | null = null;

          if (h.date) {
            date = new Date(h.date);
            if (isNaN(date.getTime())) date = null;
          } else if (h.month) {
            const [year, month] = h.month.split("-").map(Number);
            if (!isNaN(year) && !isNaN(month)) {
              date = new Date(Date.UTC(year, month - 1, 1));
            }
          }

          if (!date) continue;

          await prisma.productPriceHistory.create({
            data: {
              id: randomUUID(),
              productId: product.id,
              date,
              price: h.averagePrice ?? h.price ?? 0,
              currency: h.currency ?? "USD",
              storeName: h.storeName ?? null,
            },
          });
        }
      }

      count++;
      productIds.push(product.id);
    } catch (error) {
      console.error("Failed to ingest product", p.id ?? p.name, error);
      // continue with next product
    }
  }

  return { count, productIds };
}