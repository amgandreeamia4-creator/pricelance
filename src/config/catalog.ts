// src/config/catalog.ts

export type ProductCategory =
  | "laptop"
  | "smartphone"
  | "headphones" // includes earbuds
  | "monitor"
  | "peripheral" // keyboards, mice, basic accessories
  // v1.5 / future:
  | "coffee_machine"
  | "vacuum_cleaner"
  | "microwave"
  | "toaster"
  | "blender"
  | "food_processor";

export type StoreId =
  | "emag"
  | "altex"
  | "pcgarage"
  | "flanco"
  | "amazon_de"
  | "other_eu";

export type RegionId = "ro" | "eu_shipping";

export const CORE_REGION: RegionId = "ro";

export const SUPPORTED_REGIONS: RegionId[] = ["ro", "eu_shipping"];

export const CORE_CATEGORIES: ProductCategory[] = [
  "laptop",
  "smartphone",
  "headphones",
  "monitor",
  "peripheral",
];

export const FUTURE_CATEGORIES_V1_5: ProductCategory[] = [
  "coffee_machine",
  "vacuum_cleaner",
  "microwave",
  "toaster",
  "blender",
  "food_processor",
];

export const STORES: { id: StoreId; label: string }[] = [
  { id: "emag", label: "eMAG" },
  { id: "altex", label: "Altex" },
  { id: "pcgarage", label: "PC Garage" },
  { id: "flanco", label: "Flanco" },
  { id: "amazon_de", label: "Amazon.de" },
  { id: "other_eu", label: "Other EU Store" },
];

// Helper to display category names nicely in the UI
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  laptop: "Laptops",
  smartphone: "Smartphones",
  headphones: "Headphones & Earbuds",
  monitor: "Monitors",
  peripheral: "Keyboards & Mice",
  coffee_machine: "Coffee Machines",
  vacuum_cleaner: "Vacuum Cleaners",
  microwave: "Microwaves",
  toaster: "Toasters",
  blender: "Blenders",
  food_processor: "Food Processors",
};
