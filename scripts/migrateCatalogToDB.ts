#!/usr/bin/env tsx
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

config({ path: ".env.local" });
config({ path: ".env" });

const prisma = new PrismaClient();

interface CatalogListingJson {
  storeName: string;
  url: string | null;
  price: number;
  currency: string;
  shippingCost: number | null;
  countryCode?: string | null;
}

interface CatalogProductJson {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  description: string | null;
  listings: CatalogListingJson[];
}

async function loadCatalogJson(): Promise<CatalogProductJson[]> {
  const filePath = path.join(process.cwd(), "data", "catalog.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as CatalogProductJson[];
  if (!Array.isArray(parsed)) {
    throw new Error("catalog.json must contain an array of products");
  }
  return parsed;
}

async function main() {
  console.log("[migrateCatalogToDB] Starting migration from data/catalog.json to CuratedProduct/CuratedListing...");

  try {
    const products = await loadCatalogJson();
    console.log("[migrateCatalogToDB] Loaded products from JSON:", products.length);

    let totalListings = 0;

    for (const p of products) {
      const curatedProduct = await (prisma as any).curatedProduct.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          category: p.category,
          imageUrl: p.imageUrl ?? null,
          description: p.description ?? null,
          defaultPrice: p.listings[0]?.price ?? null,
          defaultCurrency: p.listings[0]?.currency ?? "USD",
        },
        create: {
          id: p.id,
          name: p.name,
          category: p.category,
          imageUrl: p.imageUrl ?? null,
          description: p.description ?? null,
          defaultPrice: p.listings[0]?.price ?? null,
          defaultCurrency: p.listings[0]?.currency ?? "USD",
        },
      });

      await prisma.curatedListing.deleteMany({ where: { productId: curatedProduct.id } });

      for (const listing of p.listings) {
        const countryCode = listing.countryCode ?? "US"; // Default to US when not specified
        await prisma.curatedListing.create({
          data: {
            productId: curatedProduct.id,
            storeName: listing.storeName,
            url: listing.url ?? "",
            price: listing.price,
            currency: listing.currency,
            shippingCost: listing.shippingCost ?? null,
            countryCode,
          },
        });
        totalListings += 1;
      }
    }

    console.log("[migrateCatalogToDB] Migration complete.", {
      products: products.length,
      listings: totalListings,
    });
  } catch (error) {
    console.error("[migrateCatalogToDB] Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
