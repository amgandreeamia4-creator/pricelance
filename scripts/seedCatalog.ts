#!/usr/bin/env tsx
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

config({ path: ".env.local" });
config({ path: ".env" });

const prisma = new PrismaClient();

interface CatalogListing {
  storeName: string;
  url: string;
  price: number;
  currency: string;
  shippingCost: number;
  countryCode?: string | null;
}

interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  description: string | null;
  listings: CatalogListing[];
}

async function loadCatalog(): Promise<CatalogProduct[]> {
  const filePath = path.join(process.cwd(), "data", "catalog.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as CatalogProduct[];
  if (!Array.isArray(parsed)) {
    throw new Error("catalog.json must contain an array of products");
  }
  return parsed;
}

async function main() {
  console.log("[seedCatalog] Starting curated catalog seed from data/catalog.json...");

  try {
    const products = await loadCatalog();
    console.log("[seedCatalog] Loaded products from catalog.json:", products.length);

    let totalListings = 0;

    for (const p of products) {
      const imageUrl = p.imageUrl ?? null;

      const product = await prisma.product.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          displayName: p.name,
          description: p.description ?? null,
          category: p.category,
          imageUrl,
          thumbnailUrl: imageUrl,
        },
        create: {
          id: p.id,
          name: p.name,
          displayName: p.name,
          description: p.description ?? null,
          category: p.category,
          imageUrl,
          thumbnailUrl: imageUrl,
        },
      });

      await prisma.listing.deleteMany({ where: { productId: product.id } });

      for (const listing of p.listings) {
        const countryCode = listing.countryCode ?? "US"; // Default to US when not specified
        const created = await prisma.listing.create({
          data: {
            productId: product.id,
            storeName: listing.storeName,
            url: listing.url,
            imageUrl,
            price: listing.price,
            priceCents: Math.round(listing.price * 100),
            currency: listing.currency,
            shippingCost: listing.shippingCost,
            countryCode,
            inStock: true,
          },
        });
        if (created) {
          totalListings += 1;
        }
      }
    }

    console.log("[seedCatalog] Seed complete.", {
      products: products.length,
      listings: totalListings,
    });
  } catch (error) {
    console.error("[seedCatalog] Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
