// src/config/homeCategories.ts

export type HomeCategory = {
  id: string;
  label: string;
  searchQuery?: string;
};

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: "laptop", label: "Laptops", searchQuery: "laptop" },
  { id: "phone", label: "Phones", searchQuery: "telefon" },
  { id: "monitor", label: "Monitors", searchQuery: "monitor" },
  { id: "audio", label: "Headphones & Audio", searchQuery: "casti" },
  { id: "peripherals", label: "Keyboards & Mice", searchQuery: "tastatura" },
  { id: "tv", label: "TV & Display", searchQuery: "televizor" },
  { id: "tablet", label: "Tablets", searchQuery: "tableta" },
  { id: "smartwatch", label: "Smartwatches", searchQuery: "smartwatch" },
];
