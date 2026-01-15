#!/usr/bin/env tsx
/**
 * scripts/seedStatic.ts
 *
 * CLI script to seed the database with static demo products.
 * Run with: npm run dev:seed-static
 *
 * This is useful when the RapidAPI quota is exhausted or for offline development.
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables from .env.local and .env
config({ path: ".env.local" });
config({ path: ".env" });

// Import static products data
// Note: We need to define the data inline since we can't use path aliases in scripts
const STATIC_PRODUCTS = [
  {
    id: "static-laptop-ultrabook-13",
    name: "Ultrabook 13",
    displayName: "Ultrabook 13 (16GB RAM, 512GB SSD)",
    description: "Lightweight 13-inch ultrabook with 16GB RAM and 512GB SSD, ideal for work and travel.",
    category: "laptop",
    brand: "ZenTech",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    thumbnailUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200",
    listings: [
      {
        id: "static-laptop-ultrabook-13-techstore",
        storeName: "TechStore",
        url: "https://www.techstore.com/products/ultrabook-13-16gb-512gb",
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
        price: 1099.99,
        currency: "USD",
        shippingCost: 9.99,
        deliveryTimeDays: 3,
        inStock: true,
        rating: 4.6,
        reviewCount: 187,
      },
      {
        id: "static-laptop-ultrabook-13-cityelectronics",
        storeName: "City Electronics",
        url: "https://www.cityelectronics.com/products/ultrabook-13-16gb-512gb",
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
        price: 1049.99,
        currency: "USD",
        shippingCost: 0,
        deliveryTimeDays: 5,
        inStock: true,
        rating: 4.4,
        reviewCount: 64,
      },
    ],
  },
  {
    id: "static-headphones-noise-cancelling",
    name: "QuietWave Pro",
    displayName: "QuietWave Pro Noise-Cancelling Headphones",
    description: "Wireless over-ear headphones with active noise cancellation and 30-hour battery.",
    category: "headphones",
    brand: "QuietWave",
    imageUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167",
    thumbnailUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200",
    listings: [
      {
        id: "static-headphones-noise-cancelling-audioworld",
        storeName: "AudioWorld",
        url: "https://www.audioworld.com/products/quietwave-pro",
        imageUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167",
        price: 249.99,
        currency: "USD",
        shippingCost: 0,
        deliveryTimeDays: 2,
        inStock: true,
        rating: 4.8,
        reviewCount: 321,
      },
      {
        id: "static-headphones-noise-cancelling-techmart",
        storeName: "TechMart",
        url: "https://www.techmart.com/products/quietwave-pro",
        imageUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167",
        price: 229.99,
        currency: "USD",
        shippingCost: 4.99,
        deliveryTimeDays: 1,
        inStock: true,
        rating: 4.7,
        reviewCount: 142,
      },
    ],
  },
  {
    id: "static-phone-flagship-6",
    name: "NovaPhone 6",
    displayName: "NovaPhone 6 5G (128GB)",
    description: "6.3-inch OLED flagship smartphone with 5G, 128GB storage, and dual-camera system.",
    category: "iphone smartphone",
    brand: "Nova",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
    thumbnailUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200",
    listings: [
      {
        id: "static-phone-flagship-6-mobilehub",
        storeName: "MobileHub",
        url: "https://www.mobilehub.com/products/novaphone-6-5g",
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
        price: 799.0,
        currency: "USD",
        shippingCost: 0,
        deliveryTimeDays: 2,
        inStock: true,
        rating: 4.5,
        reviewCount: 204,
      },
      {
        id: "static-phone-flagship-6-citymobile",
        storeName: "City Mobile",
        url: "https://www.citymobile.com/products/novaphone-6-5g",
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
        price: 769.0,
        currency: "USD",
        shippingCost: 14.99,
        deliveryTimeDays: 4,
        inStock: true,
        rating: 4.4,
        reviewCount: 95,
      },
    ],
  },
  {
    id: "static-fragrance-eau-de-parfum",
    name: "Aurora Eau de Parfum",
    displayName: "Aurora Eau de Parfum 50ml",
    description: "Warm floral fragrance with notes of bergamot, jasmine, and vanilla.",
    category: "perfume fragrance",
    brand: "Maison Aurora",
    imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa2",
    thumbnailUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa2?w=200",
    listings: [
      {
        id: "static-fragrance-eau-de-parfum-beautybay",
        storeName: "BeautyBay",
        url: "https://www.beautybay.com/p/maison-aurora/aurora-eau-de-parfum-50ml",
        imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa2",
        price: 89.0,
        currency: "USD",
        shippingCost: 5.99,
        deliveryTimeDays: 4,
        inStock: true,
        rating: 4.3,
        reviewCount: 67,
      },
    ],
  },
  {
    id: "static-skincare-hydrating-serum",
    name: "HydraGlow Serum",
    displayName: "HydraGlow Hydrating Serum 30ml",
    description: "Hyaluronic acid serum that provides intense hydration and a dewy finish.",
    category: "skincare",
    brand: "PureSkin Lab",
    imageUrl: "https://images.unsplash.com/photo-1612810432633-96f64dc8ccb6",
    thumbnailUrl: "https://images.unsplash.com/photo-1612810432633-96f64dc8ccb6?w=200",
    listings: [
      {
        id: "static-skincare-hydrating-serum-glowmarket",
        storeName: "Glow Market",
        url: "https://www.glowmarket.com/products/hydraglow-hydrating-serum-30ml",
        imageUrl: "https://images.unsplash.com/photo-1612810432633-96f64dc8ccb6",
        price: 39.0,
        currency: "USD",
        shippingCost: 3.99,
        deliveryTimeDays: 3,
        inStock: true,
        rating: 4.7,
        reviewCount: 154,
      },
    ],
  },
  {
    id: "static-grocery-organic-coffee-beans",
    name: "Organic Arabica Coffee Beans",
    displayName: "Organic Arabica Coffee Beans 1kg",
    description: "Medium roast organic Arabica beans with notes of chocolate and citrus.",
    category: "coffee groceries",
    brand: "Morning River",
    imageUrl: "https://images.unsplash.com/photo-1509043759401-136742328bb3",
    thumbnailUrl: "https://images.unsplash.com/photo-1509043759401-136742328bb3?w=200",
    listings: [
      {
        id: "static-grocery-organic-coffee-beans-freshmart",
        storeName: "FreshMart",
        url: "https://www.freshmart.com/products/morning-river-organic-arabica-coffee-1kg",
        imageUrl: "https://images.unsplash.com/photo-1509043759401-136742328bb3",
        price: 18.99,
        currency: "USD",
        shippingCost: 2.99,
        deliveryTimeDays: 2,
        inStock: true,
        rating: 4.9,
        reviewCount: 412,
      },
      {
        id: "static-grocery-organic-coffee-beans-localgrocer",
        storeName: "Local Grocer",
        url: "https://www.localgrocer.com/products/morning-river-organic-arabica-coffee-1kg",
        imageUrl: "https://images.unsplash.com/photo-1509043759401-136742328bb3",
        price: 17.49,
        currency: "USD",
        shippingCost: 0,
        deliveryTimeDays: 1,
        inStock: true,
        rating: 4.8,
        reviewCount: 163,
      },
    ],
  },
  {
    id: "static-grocery-breakfast-cereal",
    name: "Crunchy Oats Cereal",
    displayName: "Crunchy Oats Honey Cereal 750g",
    description: "Whole-grain oat cereal with honey clusters, high in fiber and whole grains.",
    category: "groceries",
    brand: "Sunrise Kitchen",
    imageUrl: "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e",
    thumbnailUrl: "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?w=200",
    listings: [
      {
        id: "static-grocery-breakfast-cereal-freshmart",
        storeName: "FreshMart",
        url: "https://www.freshmart.com/products/crunchy-oats-honey-cereal-750g",
        imageUrl: "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e",
        price: 5.49,
        currency: "USD",
        shippingCost: 2.49,
        deliveryTimeDays: 2,
        inStock: true,
        rating: 4.2,
        reviewCount: 89,
      },
    ],
  },
  {
    id: "static-console-gaming",
    name: "PlayBox Series Z",
    displayName: "PlayBox Series Z 1TB",
    description: "Next-gen gaming console with 1TB SSD and 4K HDR support.",
    category: "gaming",
    brand: "PlayBox",
    imageUrl: "https://images.unsplash.com/photo-1606813902914-0e6c704d008b",
    thumbnailUrl: "https://images.unsplash.com/photo-1606813902914-0e6c704d008b?w=200",
    listings: [
      {
        id: "static-console-gaming-gamehub",
        storeName: "GameHub",
        url: "https://www.gamehub.com/products/playbox-series-z-1tb",
        imageUrl: "https://images.unsplash.com/photo-1606813902914-0e6c704d008b",
        price: 499.99,
        currency: "USD",
        shippingCost: 14.99,
        deliveryTimeDays: 4,
        inStock: true,
        rating: 4.6,
        reviewCount: 298,
      },
    ],
  },
  {
    id: "static-monitor-27inch",
    name: "UltraView 27 Monitor",
    displayName: "UltraView 27\" 4K IPS Monitor",
    description: "27-inch 4K IPS monitor with HDR support, perfect for productivity and content creation.",
    category: "monitor",
    brand: "UltraView",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf",
    thumbnailUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200",
    listings: [
      {
        id: "static-monitor-27inch-techstore",
        storeName: "TechStore",
        url: "https://www.techstore.com/products/ultraview-27-4k-ips-monitor",
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf",
        price: 449.99,
        currency: "USD",
        shippingCost: 19.99,
        deliveryTimeDays: 5,
        inStock: true,
        rating: 4.5,
        reviewCount: 156,
      },
    ],
  },
  {
    id: "static-wireless-headphones",
    name: "SoundWave Wireless",
    displayName: "SoundWave Wireless Bluetooth Headphones",
    description: "Premium wireless Bluetooth headphones with 40-hour battery life and deep bass.",
    category: "wireless headphones",
    brand: "SoundWave",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    thumbnailUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
    listings: [
      {
        id: "static-wireless-headphones-audioworld",
        storeName: "AudioWorld",
        url: "https://www.audioworld.com/products/soundwave-wireless-headphones",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        price: 179.99,
        currency: "USD",
        shippingCost: 0,
        deliveryTimeDays: 2,
        inStock: true,
        rating: 4.6,
        reviewCount: 234,
      },
    ],
  },
];

const prisma = new PrismaClient();

async function seedStaticProducts() {
  console.log("[seedStatic] Starting static product seed...");
  console.log(`[seedStatic] Will seed ${STATIC_PRODUCTS.length} products`);

  let productCount = 0;
  let listingCount = 0;

  for (const p of STATIC_PRODUCTS) {
    try {
      // Upsert product
      const product = await prisma.product.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          displayName: p.displayName,
          description: p.description,
          category: p.category,
          brand: p.brand,
          imageUrl: p.imageUrl,
          thumbnailUrl: p.thumbnailUrl,
          updatedAt: new Date(),
        },
        create: {
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          description: p.description,
          category: p.category,
          brand: p.brand,
          imageUrl: p.imageUrl,
          thumbnailUrl: p.thumbnailUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Replace listings
      await prisma.listing.deleteMany({ where: { productId: product.id } });

      for (const l of p.listings) {
        await prisma.listing.create({
          data: {
            id: l.id,
            productId: product.id,
            storeName: l.storeName,
            url: l.url,
            imageUrl: l.imageUrl,
            price: l.price,
            priceCents: Math.round(l.price * 100),
            currency: l.currency,
            shippingCost: l.shippingCost,
            deliveryTimeDays: l.deliveryTimeDays,
            inStock: l.inStock,
            rating: l.rating,
            reviewCount: l.reviewCount,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        listingCount++;
      }

      productCount++;
      console.log(`[seedStatic] ✔ Seeded: ${p.name} (${p.listings.length} listings)`);
    } catch (error) {
      console.error(`[seedStatic] ✘ Failed to seed: ${p.name}`, error);
    }
  }

  console.log("\n============================================================");
  console.log("[seedStatic] SEED COMPLETE");
  console.log("============================================================");
  console.log(`  Products seeded: ${productCount}`);
  console.log(`  Listings seeded: ${listingCount}`);
  console.log("============================================================\n");
}

async function main() {
  if (process.env.ENABLE_SEED !== "true") {
    console.log(
      "Seeding is disabled. Set ENABLE_SEED=true to run seed intentionally."
    );
    return;
  }

  try {
    await seedStaticProducts();
  } catch (error) {
    console.error("[seedStatic] Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
