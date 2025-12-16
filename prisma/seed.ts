// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// Curated v1 seed for core categories and stores, aligned with src/config/catalog.ts
// Core categories: laptop, smartphone, headphones, monitor, peripheral
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
        url: "https://example.com/lenovo-thinkpad-e15-emag",
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
        url: "https://example.com/lenovo-thinkpad-e15-altex",
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
        url: "https://example.com/lenovo-thinkpad-e15-pcgarage",
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
        url: "https://example.com/iphone-15-emag",
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
        url: "https://example.com/iphone-15-altex",
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
        url: "https://example.com/iphone-15-amazonde",
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

  // v1.5 – Home & kitchen appliances
  // coffee_machine
  {
    name: "De'Longhi Magnifica S ECAM 22.110",
    displayName: "De'Longhi Magnifica S Automatic Coffee Machine",
    description: "Bean-to-cup espresso machine with integrated grinder and milk frother.",
    category: "coffee_machine",
    brand: "De'Longhi",
    thumbnailUrl:
      "https://images.pexels.com/photos/373888/pexels-photo-373888.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/373888/pexels-photo-373888.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://example.com/delonghi-magnifica-s-emag",
        imageUrl:
          "https://images.pexels.com/photos/373888/pexels-photo-373888.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 2200,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.7,
        reviewCount: 350,
      },
      {
        storeName: "Altex",
        url: "https://example.com/delonghi-magnifica-s-altex",
        imageUrl:
          "https://images.pexels.com/photos/373888/pexels-photo-373888.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 2150,
        currency: "RON",
        shippingCost: 25,
        deliveryTimeDays: 4,
        fastDelivery: false,
        location: "Cluj-Napoca, RO",
        inStock: true,
        rating: 4.6,
        reviewCount: 180,
      },
      {
        storeName: "Amazon.de",
        url: "https://example.com/delonghi-magnifica-s-amazonde",
        imageUrl:
          "https://images.pexels.com/photos/373888/pexels-photo-373888.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 430,
        currency: "EUR",
        shippingCost: 30,
        deliveryTimeDays: 6,
        fastDelivery: false,
        location: "Ships from DE to RO",
        inStock: true,
        rating: 4.7,
        reviewCount: 500,
      },
    ],
    priceHistory: [
      { month: "2024-01", averagePrice: 2400, currency: "RON" },
      { month: "2024-02", averagePrice: 2380, currency: "RON" },
      { month: "2024-03", averagePrice: 2350, currency: "RON" },
      { month: "2024-04", averagePrice: 2320, currency: "RON" },
      { month: "2024-05", averagePrice: 2300, currency: "RON" },
      { month: "2024-06", averagePrice: 2280, currency: "RON" },
      { month: "2024-07", averagePrice: 2250, currency: "RON" },
      { month: "2024-08", averagePrice: 2230, currency: "RON" },
      { month: "2024-09", averagePrice: 2200, currency: "RON" },
      { month: "2024-10", averagePrice: 2180, currency: "RON" },
      { month: "2024-11", averagePrice: 2150, currency: "RON" },
      { month: "2024-12", averagePrice: 2120, currency: "RON" },
    ],
  },

  {
    name: "Philips Series 2200 EP2220/10",
    displayName: "Philips 2200 Series Automatic Coffee Machine",
    description: "Compact espresso machine with ceramic grinder and milk frothing.",
    category: "coffee_machine",
    brand: "Philips",
    thumbnailUrl:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "Flanco",
        url: "https://example.com/philips-2200-flanco",
        imageUrl:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 1900,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.5,
        reviewCount: 220,
      },
      {
        storeName: "Other EU Store",
        url: "https://example.com/philips-2200-eu",
        imageUrl:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 380,
        currency: "EUR",
        shippingCost: 25,
        deliveryTimeDays: 7,
        fastDelivery: false,
        location: "EU shipping to RO",
        inStock: true,
        rating: 4.4,
        reviewCount: 160,
      },
    ],
  },

  // vacuum_cleaner
  {
    name: "Dyson V12 Detect Slim",
    displayName: "Dyson V12 Detect Slim Cordless Vacuum Cleaner",
    description: "Cordless vacuum with laser dust detection and HEPA filtration.",
    category: "vacuum_cleaner",
    brand: "Dyson",
    thumbnailUrl:
      "https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://example.com/dyson-v12-emag",
        imageUrl:
          "https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 2800,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.8,
        reviewCount: 420,
      },
      {
        storeName: "Altex",
        url: "https://example.com/dyson-v12-altex",
        imageUrl:
          "https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 2750,
        currency: "RON",
        shippingCost: 35,
        deliveryTimeDays: 4,
        fastDelivery: false,
        location: "Online RO",
        inStock: true,
        rating: 4.7,
        reviewCount: 210,
      },
    ],
  },
  {
    name: "Bosch Serie 6 ProHygienic",
    displayName: "Bosch Serie 6 ProHygienic Bagless Vacuum Cleaner",
    description: "Bagless vacuum cleaner with HEPA filter and strong suction.",
    category: "vacuum_cleaner",
    brand: "Bosch",
    thumbnailUrl:
      "https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "Flanco",
        url: "https://example.com/bosch-serie6-flanco",
        imageUrl:
          "https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 1200,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.5,
        reviewCount: 150,
      },
      {
        storeName: "Other EU Store",
        url: "https://example.com/bosch-serie6-eu",
        imageUrl:
          "https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 260,
        currency: "EUR",
        shippingCost: 25,
        deliveryTimeDays: 7,
        fastDelivery: false,
        location: "EU shipping to RO",
        inStock: true,
        rating: 4.4,
        reviewCount: 90,
      },
    ],
  },

  // microwave
  {
    name: "Samsung MG23K3515AK",
    displayName: "Samsung 23L Grill Microwave MG23K3515AK",
    description: "23L microwave with grill, ceramic enamel interior and auto menus.",
    category: "microwave",
    brand: "Samsung",
    thumbnailUrl:
      "https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://example.com/samsung-mg23-emag",
        imageUrl:
          "https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 650,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.6,
        reviewCount: 230,
      },
      {
        storeName: "Altex",
        url: "https://example.com/samsung-mg23-altex",
        imageUrl:
          "https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 630,
        currency: "RON",
        shippingCost: 20,
        deliveryTimeDays: 4,
        fastDelivery: false,
        location: "Online RO",
        inStock: true,
        rating: 4.5,
        reviewCount: 140,
      },
    ],
  },
  {
    name: "LG NeoChef 25L",
    displayName: "LG NeoChef 25L Smart Inverter Microwave",
    description: "25L inverter microwave with even heating and defrosting.",
    category: "microwave",
    brand: "LG",
    thumbnailUrl:
      "https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "Flanco",
        url: "https://example.com/lg-neochef-flanco",
        imageUrl:
          "https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 780,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.5,
        reviewCount: 110,
      },
      {
        storeName: "Other EU Store",
        url: "https://example.com/lg-neochef-eu",
        imageUrl:
          "https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 160,
        currency: "EUR",
        shippingCost: 25,
        deliveryTimeDays: 7,
        fastDelivery: false,
        location: "EU shipping to RO",
        inStock: true,
        rating: 4.4,
        reviewCount: 80,
      },
    ],
  },

  // toaster
  {
    name: "Tefal Express Toast TT3650",
    displayName: "Tefal Express Toast 2-Slice Toaster",
    description: "2-slice toaster with browning control and defrost function.",
    category: "toaster",
    brand: "Tefal",
    thumbnailUrl:
      "https://images.pexels.com/photos/4109997/pexels-photo-4109997.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/4109997/pexels-photo-4109997.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://example.com/tefal-express-toast-emag",
        imageUrl:
          "https://images.pexels.com/photos/4109997/pexels-photo-4109997.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 220,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.4,
        reviewCount: 90,
      },
      {
        storeName: "Altex",
        url: "https://example.com/tefal-express-toast-altex",
        imageUrl:
          "https://images.pexels.com/photos/4109997/pexels-photo-4109997.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 210,
        currency: "RON",
        shippingCost: 15,
        deliveryTimeDays: 4,
        fastDelivery: false,
        location: "Online RO",
        inStock: true,
        rating: 4.3,
        reviewCount: 70,
      },
    ],
  },
  {
    name: "Bosch ComfortLine TAT6A003",
    displayName: "Bosch ComfortLine 2-Slice Toaster",
    description: "Compact toaster with 6 browning levels and bread centering.",
    category: "toaster",
    brand: "Bosch",
    thumbnailUrl:
      "https://images.pexels.com/photos/4109997/pexels-photo-4109997.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/4109997/pexels-photo-4109997.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "Flanco",
        url: "https://example.com/bosch-comfortline-flanco",
        imageUrl:
          "https://images.pexels.com/photos/4109997/pexels-photo-4109997.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 260,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.5,
        reviewCount: 60,
      },
      {
        storeName: "Other EU Store",
        url: "https://example.com/bosch-comfortline-eu",
        imageUrl:
          "https://images.pexels.com/photos/4109997/pexels-photo-4109997.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 60,
        currency: "EUR",
        shippingCost: 20,
        deliveryTimeDays: 7,
        fastDelivery: false,
        location: "EU shipping to RO",
        inStock: true,
        rating: 4.4,
        reviewCount: 45,
      },
    ],
  },

  // blender
  {
    name: "Philips ProBlend 5000",
    displayName: "Philips ProBlend 5000 Stand Blender",
    description: "Glass jar blender with multiple speeds and ice crush function.",
    category: "blender",
    brand: "Philips",
    thumbnailUrl:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://example.com/philips-problend-emag",
        imageUrl:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 350,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.5,
        reviewCount: 130,
      },
      {
        storeName: "Altex",
        url: "https://example.com/philips-problend-altex",
        imageUrl:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 340,
        currency: "RON",
        shippingCost: 15,
        deliveryTimeDays: 4,
        fastDelivery: false,
        location: "Online RO",
        inStock: true,
        rating: 4.4,
        reviewCount: 90,
      },
    ],
  },
  {
    name: "NutriBullet 900 Series",
    displayName: "NutriBullet 900 Personal Blender",
    description: "Compact personal blender for smoothies and shakes.",
    category: "blender",
    brand: "NutriBullet",
    thumbnailUrl:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "Flanco",
        url: "https://example.com/nutribullet-900-flanco",
        imageUrl:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 420,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.6,
        reviewCount: 160,
      },
      {
        storeName: "Amazon.de",
        url: "https://example.com/nutribullet-900-amazonde",
        imageUrl:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 95,
        currency: "EUR",
        shippingCost: 20,
        deliveryTimeDays: 6,
        fastDelivery: false,
        location: "Ships from DE to RO",
        inStock: true,
        rating: 4.5,
        reviewCount: 210,
      },
    ],
  },

  // food_processor
  {
    name: "Bosch MultiTalent 8 MC812S734",
    displayName: "Bosch MultiTalent 8 Food Processor",
    description: "1200W food processor with multiple discs and blender attachment.",
    category: "food_processor",
    brand: "Bosch",
    thumbnailUrl:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "eMAG",
        url: "https://example.com/bosch-multitalent8-emag",
        imageUrl:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 950,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Bucharest, RO",
        inStock: true,
        rating: 4.6,
        reviewCount: 140,
      },
      {
        storeName: "Altex",
        url: "https://example.com/bosch-multitalent8-altex",
        imageUrl:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 930,
        currency: "RON",
        shippingCost: 25,
        deliveryTimeDays: 4,
        fastDelivery: false,
        location: "Online RO",
        inStock: true,
        rating: 4.5,
        reviewCount: 90,
      },
    ],
  },
  {
    name: "Kenwood Multipro Compact FDM304SS",
    displayName: "Kenwood Multipro Compact Food Processor",
    description: "800W compact food processor with stainless steel bowl.",
    category: "food_processor",
    brand: "Kenwood",
    thumbnailUrl:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400",
    imageUrl:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
    listings: [
      {
        storeName: "Flanco",
        url: "https://example.com/kenwood-multipro-flanco",
        imageUrl:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 680,
        currency: "RON",
        shippingCost: 0,
        deliveryTimeDays: 3,
        fastDelivery: true,
        location: "Online RO",
        inStock: true,
        rating: 4.4,
        reviewCount: 110,
      },
      {
        storeName: "Other EU Store",
        url: "https://example.com/kenwood-multipro-eu",
        imageUrl:
          "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 150,
        currency: "EUR",
        shippingCost: 25,
        deliveryTimeDays: 7,
        fastDelivery: false,
        location: "EU shipping to RO",
        inStock: true,
        rating: 4.3,
        reviewCount: 80,
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