// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Self-contained demo data for local/dev, including explicit iPhone 15 products.
const PRODUCTS = [
  {
    name: 'UltraSlim 14" Laptop',
    displayName: 'UltraSlim 14" Laptop (16GB RAM, 512GB SSD)',
    description: "Lightweight laptop for everyday work and browsing.",
    category: "Laptops",
    brand: "NovaTech",
    thumbnailUrl:
      "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
    imageUrl:
      "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "TechStore",
        url: "https://example.com/ultraslim-14",
        imageUrl:
          "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
        price: 899.99,
        currency: "USD",
        shippingCost: 9.99,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online",
        inStock: true,
        rating: 4.6,
        reviewCount: 128,
      },
      {
        storeName: "FastElectro",
        url: "https://example.com/ultraslim-14-fast",
        imageUrl:
          "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
        price: 929.0,
        currency: "USD",
        shippingCost: 0,
        deliveryTimeDays: 1,
        fastDelivery: true,
        location: "Same-day metro",
        inStock: true,
        rating: 4.8,
        reviewCount: 64,
      },
    ],
    priceHistory: [
      { month: "2024-01", averagePrice: 999.99, currency: "USD" },
      { month: "2024-03", averagePrice: 949.99, currency: "USD" },
      { month: "2024-06", averagePrice: 899.99, currency: "USD" },
    ],
  },
  {
    name: "Barista Pro Coffee Machine",
    displayName: "Barista Pro Coffee Machine (Dual Boiler)",
    description: "Home espresso machine with dual boiler and steam wand.",
    category: "Kitchen",
    brand: "CaffèLux",
    thumbnailUrl:
      "https://images.pexels.com/photos/373888/pexels-photo-373888.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageUrl:
      "https://images.pexels.com/photos/373888/pexels-photo-373888.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "HomeApplianceHub",
        url: "https://example.com/barista-pro",
        imageUrl:
          "https://images.pexels.com/photos/373888/pexels-photo-373888.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 499.0,
        currency: "USD",
        shippingCost: 19.99,
        deliveryTimeDays: 5,
        fastDelivery: false,
        location: "Warehouse",
        inStock: true,
        rating: 4.4,
        reviewCount: 210,
      },
    ],
    priceHistory: [
      { month: "2023-12", averagePrice: 549.0, currency: "USD" },
      { month: "2024-02", averagePrice: 529.0, currency: "USD" },
      { month: "2024-05", averagePrice: 499.0, currency: "USD" },
    ],
  },
  {
    id: "seed-iphone-15",
    name: "Apple iPhone 15",
    displayName: "Apple iPhone 15 128GB (5G)",
    description:
      "Apple iPhone 15 with 6.1-inch display, A16 Bionic chip, and 128GB storage.",
    category: "Smartphones",
    brand: "Apple",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
    listings: [
      {
        id: "seed-iphone-15-techstore",
        storeName: "TechStore",
        url: "https://example.com/apple-iphone-15-128",
        imageUrl:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
        price: 899.0,
        currency: "USD",
        shippingCost: 9.99,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online",
        inStock: true,
        rating: 4.7,
        reviewCount: 342,
      },
      {
        id: "seed-iphone-15-citymobile",
        storeName: "City Mobile",
        url: "https://example.com/apple-iphone-15-128-city",
        imageUrl:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
        price: 879.0,
        currency: "USD",
        shippingCost: 0,
        deliveryTimeDays: 5,
        fastDelivery: false,
        location: "San Francisco, CA",
        inStock: true,
        rating: 4.6,
        reviewCount: 190,
      },
    ],
    priceHistory: [
      { month: "2024-09", averagePrice: 949.0, currency: "USD" },
      { month: "2024-11", averagePrice: 929.0, currency: "USD" },
      { month: "2025-01", averagePrice: 899.0, currency: "USD" },
    ],
  },
  {
    id: "seed-iphone-15-pro",
    name: "Apple iPhone 15 Pro",
    displayName: "Apple iPhone 15 Pro 256GB (5G)",
    description:
      "Apple iPhone 15 Pro with 6.1-inch ProMotion display, A17 Pro chip, and 256GB storage.",
    category: "Smartphones",
    brand: "Apple",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?w=400",
    imageUrl:
      "https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?w=800",
    listings: [
      {
        id: "seed-iphone-15-pro-mobilehub",
        storeName: "MobileHub",
        url: "https://example.com/apple-iphone-15-pro-256",
        imageUrl:
          "https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?w=800",
        price: 1199.0,
        currency: "USD",
        shippingCost: 14.99,
        deliveryTimeDays: 2,
        fastDelivery: true,
        location: "Online",
        inStock: true,
        rating: 4.8,
        reviewCount: 412,
      },
      {
        id: "seed-iphone-15-pro-premiumstore",
        storeName: "Premium Store",
        url: "https://example.com/apple-iphone-15-pro-256-premium",
        imageUrl:
          "https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?w=800",
        price: 1169.0,
        currency: "USD",
        shippingCost: 0,
        deliveryTimeDays: 4,
        fastDelivery: false,
        location: "New York, NY",
        inStock: true,
        rating: 4.9,
        reviewCount: 275,
      },
    ],
    priceHistory: [
      { month: "2024-10", averagePrice: 1249.0, currency: "USD" },
      { month: "2024-12", averagePrice: 1219.0, currency: "USD" },
      { month: "2025-02", averagePrice: 1199.0, currency: "USD" },
    ],
  },
];

// Seed one product
async function seedProduct(p: any) {
  console.log(`Seeding product: ${p.name}`);

  // 1) Create the Product
  const product = await prisma.product.create({
    data: {
      // use provided id if present, otherwise let Prisma generate
      id: p.id ?? undefined,
      name: p.name,
      displayName: p.displayName ?? p.name,
      description: p.description ?? null,
      category: p.category ?? null,
      brand: p.brand ?? null,
      thumbnailUrl: p.thumbnailUrl ?? p.imageUrl ?? null,
      imageUrl: p.imageUrl ?? p.thumbnailUrl ?? null,
    },
  });

  // 2) Create Listings
  if (Array.isArray(p.listings)) {
    for (const l of p.listings) {
      await prisma.listing.create({
        data: {
          id: l.id ?? undefined,
          productId: product.id,

          // Prefer explicit storeName, but fall back to older "store" key if present
          storeName: l.storeName ?? l.store ?? "Unknown store",
          storeLogoUrl: l.storeLogoUrl ?? null,
          url: l.url ?? null,
          imageUrl: l.imageUrl ?? product.imageUrl ?? null,

          price: typeof l.price === "number" ? l.price : 0,
          priceCents:
            typeof l.price === "number" ? Math.round(l.price * 100) : 0,
          currency: l.currency ?? "USD",

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
        },
      });
    }
  }

  // 3) Create Price History (supports both { month } and { date })
  if (Array.isArray(p.priceHistory)) {
    for (const h of p.priceHistory) {
      let date: Date | null = null;

      if (h.date) {
        date = new Date(h.date);
        if (isNaN(date.getTime())) {
          date = null;
        }
      } else if (h.month) {
        // h.month is "YYYY-MM" → first day of that month (UTC)
        const [year, month] = String(h.month)
          .split("-")
          .map((v: string) => Number(v));
        if (!isNaN(year) && !isNaN(month)) {
          date = new Date(Date.UTC(year, month - 1, 1));
        }
      }

      if (!date) continue;

      await prisma.productPriceHistory.create({
        data: {
          productId: product.id,
          date,
          price:
            typeof h.averagePrice === "number"
              ? h.averagePrice
              : typeof h.price === "number"
              ? h.price
              : 0,
          currency: h.currency ?? "USD",
          storeName: h.storeName ?? null,
        },
      });
    }
  }
}

async function main() {
  console.log(`Seeding ${PRODUCTS.length} products…`);

  // Clear tables in FK-safe order
  await prisma.productPriceHistory.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.product.deleteMany();

  for (const p of PRODUCTS as any[]) {
    await seedProduct(p);
  }

  console.log("Seeding complete ✅");
}

main()
  .catch((e) => {
    console.error("Seed failed ❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });