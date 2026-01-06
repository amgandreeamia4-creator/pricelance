// src/config/homeCategories.ts

export type HomeCategory = {
  id: string;
  label: string;
  searchQuery?: string;
};

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: "laptop",     label: "Laptopuri",        searchQuery: "laptop" },
  { id: "phone",      label: "Telefoane",       searchQuery: "telefon" },
  { id: "monitor",    label: "Monitoare",       searchQuery: "monitor" },
  { id: "audio",      label: "Căști & Audio",   searchQuery: "casti" },
  { id: "peripherals",label: "Tastaturi & Mouse", searchQuery: "tastatura" },
  { id: "tv",         label: "TV & Display",    searchQuery: "televizor" },
  { id: "tablet",     label: "Tablete",         searchQuery: "tableta" },
  { id: "smartwatch", label: "Smartwatch",      searchQuery: "smartwatch" },
];
