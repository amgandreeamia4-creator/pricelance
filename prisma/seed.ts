// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// Curated v1 seed for core categories and stores, aligned with src/config/catalog.ts
// Canonical categories (v1): laptop, smartphone, headphones, monitor, keyboard-mouse
// Stores (storeName values): eMAG, Altex, PC Garage, Flanco, Amazon.de, Other EU Store
const PRODUCTS = [
  // Laptops
  {
    name: "Lenovo ThinkPad E15",
    displayName: "Lenovo ThinkPad E15 (i5, 16GB, 512GB SSD)",
    description: "15.6\" business laptop with solid keyboard and battery life.",
    category: "laptop",
    brand: "Lenovo",
    thumbnailUrl:
      "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://www.emag.ro/laptop-lenovo-thinkpad-e15-i5-16gb-512gb-ssd",
        imageUrl:
          "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
        price: 3200,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 2,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.6,
        reviewCount: 215,
      },
      {
        storeName: "Altex",
        url: "https://altex.ro/laptop-lenovo-thinkpad-e15-i5-16gb-512gb-ssd",
        imageUrl:
          "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
        price: 3350,
        currency: "RON",
        shippingCost: 19,
        deliveryTimeDays: 3,
        fastDelivery: false,
        location: "Cluj-Napoca, RO",
        inStock: true,
        rating: 4.5,
        reviewCount: 98,
      },
      {
        storeName: "PC Garage",
        url: "https://www.pcgarage.ro/laptopuri/lenovo/thinkpad-e15-i5-16gb-512gb-ssd/",
        imageUrl:
          "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
        price: 3100,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 4,
        fastDelivery: false,
        location: "Online RO",
        inStock: true,
        rating: 4.7,
        reviewCount: 150,
      },
    ],
    priceHistory: [
      { month: "2024-01", averagePrice: 3400, currency: "RON" },
      { month: "2024-02", averagePrice: 3380, currency: "RON" },
      { month: "2024-03", averagePrice: 3350, currency: "RON" },
      { month: "2024-04", averagePrice: 3320, currency: "RON" },
      { month: "2024-05", averagePrice: 3300, currency: "RON" },
      { month: "2024-06", averagePrice: 3280, currency: "RON" },
      { month: "2024-07", averagePrice: 3250, currency: "RON" },
      { month: "2024-08", averagePrice: 3230, currency: "RON" },
      { month: "2024-09", averagePrice: 3200, currency: "RON" },
      { month: "2024-10", averagePrice: 3180, currency: "RON" },
      { month: "2024-11", averagePrice: 3150, currency: "RON" },
      { month: "2024-12", averagePrice: 3120, currency: "RON" },
    ],
  },

  // Smartphones
  {
    name: "Apple iPhone 15",
    displayName: "Apple iPhone 15 128GB (5G)",
    description: "6.1-inch OLED display, A16 Bionic chip, 5G support.",
    category: "smartphone",
    brand: "Apple",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://www.emag.ro/apple-iphone-15-128gb-5g",
        imageUrl:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
        price: 4800,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 2,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.8,
        reviewCount: 600,
      },
      {
        storeName: "Altex",
        url: "https://altex.ro/apple-iphone-15-128gb-5g",
        imageUrl:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
        price: 4700,
        currency: "RON",
        shippingCost: 20,
        deliveryTimeDays: 3,
        fastDelivery: false,
        location: "Brasov, RO",
        inStock: true,
        rating: 4.7,
        reviewCount: 210,
      },
      {
        storeName: "Amazon.de",
        url: "https://www.amazon.de/dp/B0CIPHONE15",
        imageUrl:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
        price: 980,
        currency: "EUR",
        shippingCost: 20,
        deliveryTimeDays: 6,
        fastDelivery: false,
        location: "Ships from DE to RO",
        inStock: true,
        rating: 4.8,
        reviewCount: 800,
      },
    ],
    priceHistory: [
      { month: "2024-01", averagePrice: 5200, currency: "RON" },
      { month: "2024-02", averagePrice: 5180, currency: "RON" },
      { month: "2024-03", averagePrice: 5150, currency: "RON" },
      { month: "2024-04", averagePrice: 5120, currency: "RON" },
      { month: "2024-05", averagePrice: 5100, currency: "RON" },
      { month: "2024-06", averagePrice: 5080, currency: "RON" },
      { month: "2024-07", averagePrice: 5050, currency: "RON" },
      { month: "2024-08", averagePrice: 5030, currency: "RON" },
      { month: "2024-09", averagePrice: 5000, currency: "RON" },
      { month: "2024-10", averagePrice: 4980, currency: "RON" },
      { month: "2024-11", averagePrice: 4950, currency: "RON" },
      { month: "2024-12", averagePrice: 4920, currency: "RON" },
    ],
  },

  // Headphones
  {
    name: "Sony WH-1000XM5",
    displayName: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    description: "Industry-leading noise cancellation with exceptional sound quality and 30-hour battery.",
    category: "headphones",
    brand: "Sony",
    thumbnailUrl:
      "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://www.emag.ro/casti-sony-wh-1000xm5",
        imageUrl:
          "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 1800,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 2,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.9,
        reviewCount: 520,
      },
      {
        storeName: "Altex",
        url: "https://altex.ro/casti-sony-wh-1000xm5",
        imageUrl:
          "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 1750,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Cluj-Napoca, RO",
        inStock: true,
        rating: 4.8,
        reviewCount: 280,
      },
      {
        storeName: "Amazon.de",
        url: "https://www.amazon.de/dp/B09Y2JH5D3",
        imageUrl:
          "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 350,
        currency: "EUR",
        shippingCost: 15,
        deliveryTimeDays: 5,
        fastDelivery: false,
        location: "Ships from DE to RO",
        inStock: true,
        rating: 4.8,
        reviewCount: 1200,
      },
    ],
    priceHistory: [
      { month: "2024-01", averagePrice: 2000, currency: "RON" },
      { month: "2024-02", averagePrice: 1980, currency: "RON" },
      { month: "2024-03", averagePrice: 1950, currency: "RON" },
      { month: "2024-04", averagePrice: 1920, currency: "RON" },
      { month: "2024-05", averagePrice: 1900, currency: "RON" },
      { month: "2024-06", averagePrice: 1880, currency: "RON" },
      { month: "2024-07", averagePrice: 1850, currency: "RON" },
      { month: "2024-08", averagePrice: 1830, currency: "RON" },
      { month: "2024-09", averagePrice: 1800, currency: "RON" },
      { month: "2024-10", averagePrice: 1780, currency: "RON" },
      { month: "2024-11", averagePrice: 1750, currency: "RON" },
      { month: "2024-12", averagePrice: 1720, currency: "RON" },
    ],
  },

  {
    name: "Apple AirPods Pro 2",
    displayName: "Apple AirPods Pro (2nd Gen) with USB-C",
    description: "True wireless earbuds with active noise cancellation and spatial audio.",
    category: "headphones",
    brand: "Apple",
    thumbnailUrl:
      "https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://www.emag.ro/apple-airpods-pro-2-usb-c",
        imageUrl:
          "https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 1200,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 2,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.9,
        reviewCount: 890,
      },
      {
        storeName: "Flanco",
        url: "https://www.flanco.ro/apple-airpods-pro-2-usb-c.html",
        imageUrl:
          "https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 1180,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.8,
        reviewCount: 340,
      },
    ],
  },

  // Monitors
  {
    name: "Dell UltraSharp U2723QE",
    displayName: "Dell UltraSharp 27 4K USB-C Hub Monitor",
    description: "27-inch 4K IPS monitor with USB-C hub and excellent color accuracy.",
    category: "monitor",
    brand: "Dell",
    thumbnailUrl:
      "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "PC Garage",
        url: "https://www.pcgarage.ro/monitoare/dell/ultrasharp-u2723qe/",
        imageUrl:
          "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 3200,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.8,
        reviewCount: 95,
      },
      {
        storeName: "eMAG",
        url: "https://www.emag.ro/monitor-dell-ultrasharp-u2723qe",
        imageUrl:
          "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 3300,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 2,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.7,
        reviewCount: 62,
      },
      {
        storeName: "Amazon.de",
        url: "https://www.amazon.de/dp/B09TQZP9CL",
        imageUrl:
          "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 650,
        currency: "EUR",
        shippingCost: 25,
        deliveryTimeDays: 6,
        fastDelivery: false,
        location: "Ships from DE to RO",
        inStock: true,
        rating: 4.6,
        reviewCount: 320,
      },
    ],
    priceHistory: [
      { month: "2024-01", averagePrice: 3600, currency: "RON" },
      { month: "2024-02", averagePrice: 3550, currency: "RON" },
      { month: "2024-03", averagePrice: 3500, currency: "RON" },
      { month: "2024-04", averagePrice: 3450, currency: "RON" },
      { month: "2024-05", averagePrice: 3400, currency: "RON" },
      { month: "2024-06", averagePrice: 3350, currency: "RON" },
      { month: "2024-07", averagePrice: 3300, currency: "RON" },
      { month: "2024-08", averagePrice: 3280, currency: "RON" },
      { month: "2024-09", averagePrice: 3250, currency: "RON" },
      { month: "2024-10", averagePrice: 3220, currency: "RON" },
      { month: "2024-11", averagePrice: 3200, currency: "RON" },
      { month: "2024-12", averagePrice: 3180, currency: "RON" },
    ],
  },

  {
    name: "LG 27GP850-B",
    displayName: "LG UltraGear 27 QHD 165Hz Gaming Monitor",
    description: "27-inch QHD Nano IPS gaming monitor with 165Hz and 1ms response time.",
    category: "monitor",
    brand: "LG",
    thumbnailUrl:
      "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "PC Garage",
        url: "https://www.pcgarage.ro/monitoare/lg/ultragear-27gp850-b/",
        imageUrl:
          "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 1800,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 2,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.7,
        reviewCount: 180,
      },
      {
        storeName: "Altex",
        url: "https://altex.ro/monitor-lg-ultragear-27gp850-b",
        imageUrl:
          "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 1850,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Cluj-Napoca, RO",
        inStock: true,
        rating: 4.6,
        reviewCount: 95,
      },
    ],
  },

  // Keyboards & Mice
  {
    name: "Logitech MX Keys S",
    displayName: "Logitech MX Keys S Wireless Keyboard",
    description: "Premium wireless keyboard with smart backlighting and multi-device support.",
    category: "keyboard-mouse",
    brand: "Logitech",
    thumbnailUrl:
      "https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://www.emag.ro/tastatura-logitech-mx-keys-s",
        imageUrl:
          "https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 650,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 2,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.8,
        reviewCount: 210,
      },
      {
        storeName: "PC Garage",
        url: "https://www.pcgarage.ro/tastaturi/logitech/mx-keys-s/",
        imageUrl:
          "https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 630,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.7,
        reviewCount: 145,
      },
      {
        storeName: "Amazon.de",
        url: "https://www.amazon.de/dp/B0BKW2LK4V",
        imageUrl:
          "https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 120,
        currency: "EUR",
        shippingCost: 10,
        deliveryTimeDays: 5,
        fastDelivery: false,
        location: "Ships from DE to RO",
        inStock: true,
        rating: 4.7,
        reviewCount: 580,
      },
    ],
    priceHistory: [
      { month: "2024-01", averagePrice: 720, currency: "RON" },
      { month: "2024-02", averagePrice: 710, currency: "RON" },
      { month: "2024-03", averagePrice: 700, currency: "RON" },
      { month: "2024-04", averagePrice: 690, currency: "RON" },
      { month: "2024-05", averagePrice: 680, currency: "RON" },
      { month: "2024-06", averagePrice: 670, currency: "RON" },
      { month: "2024-07", averagePrice: 660, currency: "RON" },
      { month: "2024-08", averagePrice: 655, currency: "RON" },
      { month: "2024-09", averagePrice: 650, currency: "RON" },
      { month: "2024-10", averagePrice: 645, currency: "RON" },
      { month: "2024-11", averagePrice: 640, currency: "RON" },
      { month: "2024-12", averagePrice: 635, currency: "RON" },
    ],
  },

  {
    name: "Logitech MX Master 3S",
    displayName: "Logitech MX Master 3S Wireless Mouse",
    description: "Advanced wireless mouse with 8K DPI sensor and quiet clicks.",
    category: "keyboard-mouse",
    brand: "Logitech",
    thumbnailUrl:
      "https://images.pexels.com/photos/5082560/pexels-photo-5082560.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/5082560/pexels-photo-5082560.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://www.emag.ro/mouse-logitech-mx-master-3s",
        imageUrl:
          "https://images.pexels.com/photos/5082560/pexels-photo-5082560.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 550,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 2,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.9,
        reviewCount: 380,
      },
      {
        storeName: "Altex",
        url: "https://altex.ro/mouse-logitech-mx-master-3s",
        imageUrl:
          "https://images.pexels.com/photos/5082560/pexels-photo-5082560.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 540,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.8,
        reviewCount: 195,
      },
      {
        storeName: "Amazon.de",
        url: "https://www.amazon.de/dp/B09HM94VDS",
        imageUrl:
          "https://images.pexels.com/photos/5082560/pexels-photo-5082560.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 100,
        currency: "EUR",
        shippingCost: 10,
        deliveryTimeDays: 5,
        fastDelivery: false,
        location: "Ships from DE to RO",
        inStock: true,
        rating: 4.8,
        reviewCount: 920,
      },
    ],
  },
];

// Seed one product
async function seedProduct(p: any) {
  console.log(`Seeding product: ${p.name}`);

  // 1) Create the Product
  const product = await prisma.product.create({
    data: {
      // Use provided id if present, otherwise generate a stable UUID
      id: p.id ?? randomUUID(),
      name: p.name,
      displayName: p.displayName ?? p.name,
      description: p.description ?? null,
      category: p.category ?? null,
      brand: p.brand ?? null,
      thumbnailUrl: p.thumbnailUrl ?? p.imageUrl ?? null,
      imageUrl: p.imageUrl ?? p.thumbnailUrl ?? null,
      updatedAt: new Date(),
    },
  });

  // 2) Create Listings
  if (Array.isArray(p.listings)) {
    for (const l of p.listings) {
      await prisma.listing.create({
        data: {
          id: l.id ?? randomUUID(),
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
          updatedAt: new Date(),
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
          id: randomUUID(),
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
  if (process.env.ENABLE_SEED !== "true") {
    console.log(
      "Seeding is disabled. Set ENABLE_SEED=true to run seed intentionally."
    );
    return;
  }

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