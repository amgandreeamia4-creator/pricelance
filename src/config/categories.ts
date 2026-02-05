// src/config/categories.ts
// Single source of truth for all product categories
// Used by: inference, API, UI, admin tools

export type CategoryFamilySlug =
  | "tech"
  | "gifts-lifestyle"
  | "books-media"
  | "toys-games"
  | "kitchen"
  | "home-garden";

export type CategorySlug =
  | "laptops"
  | "phones"
  | "phone-cases-protection"
  | "monitors"
  | "tv-display"
  | "headphones-audio"
  | "keyboards-mice"
  | "tablets"
  | "smartwatches"
  | "personal-care"
  | "small-appliances"
  | "wellness-supplements"
  | "gifts-lifestyle"
  | "books-media"
  | "toys-games"
  | "home-garden"
  | "kitchen";

export type CanonicalCategoryLabel =
  | "Laptops"
  | "Phones"
  | "Phone Cases & Protection"
  | "Monitors"
  | "TV & Display"
  | "Headphones & Audio"
  | "Keyboards & Mice"
  | "Tablets"
  | "Smartwatches"
  | "Personal Care"
  | "Small Appliances"
  | "Wellness & Supplements"
  | "Gifts & Lifestyle"
  | "Books & Media"
  | "Toys & Games"
  | "Home & Garden"
  | "Kitchen";

export type CategoryNode = {
  family: CategoryFamilySlug;
  slug: CategorySlug;
  label: CanonicalCategoryLabel;
};

export const CATEGORY_TREE: CategoryNode[] = [
  // Tech (7 categories)
  { family: "tech", slug: "laptops", label: "Laptops" },
  { family: "tech", slug: "phones", label: "Phones" },
  {
    family: "tech",
    slug: "phone-cases-protection",
    label: "Phone Cases & Protection",
  },
  { family: "tech", slug: "monitors", label: "Monitors" },
  { family: "tech", slug: "tv-display", label: "TV & Display" },
  { family: "tech", slug: "headphones-audio", label: "Headphones & Audio" },
  { family: "tech", slug: "keyboards-mice", label: "Keyboards & Mice" },
  { family: "tech", slug: "tablets", label: "Tablets" },
  { family: "tech", slug: "smartwatches", label: "Smartwatches" },
  
  // Gifts & Lifestyle (3 categories)
  { family: "gifts-lifestyle", slug: "personal-care", label: "Personal Care" },
  { family: "gifts-lifestyle", slug: "wellness-supplements", label: "Wellness & Supplements" },
  { family: "gifts-lifestyle", slug: "gifts-lifestyle", label: "Gifts & Lifestyle" },
  
  // Books & Media (1 category)
  { family: "books-media", slug: "books-media", label: "Books & Media" },
  
  // Toys & Games (1 category)
  { family: "toys-games", slug: "toys-games", label: "Toys & Games" },
  
  // Kitchen (2 categories)
  { family: "kitchen", slug: "kitchen", label: "Kitchen" },
  { family: "kitchen", slug: "small-appliances", label: "Small Appliances" },
  
  // Home & Garden (1 category)
  { family: "home-garden", slug: "home-garden", label: "Home & Garden" },
];

export function getCategoryBySlug(slug: string | null) {
  if (!slug) return undefined;
  return CATEGORY_TREE.find((c) => c.slug === slug);
}

export function getCategoryByLabel(label: string | null) {
  if (!label) return undefined;
  const lower = label.toLowerCase();
  return CATEGORY_TREE.find((c) => c.label.toLowerCase() === lower);
}

export function dbCategoryFromSlug(
  slug: string | null,
): CanonicalCategoryLabel | undefined {
  const node = getCategoryBySlug(slug);
  return node?.label;
}

export function slugFromDbCategory(
  dbValue: string | null,
): CategorySlug | undefined {
  if (!dbValue) return undefined;
  const node = getCategoryByLabel(dbValue);
  return node?.slug;
}

// Legacy exports for backward compatibility
export const CANONICAL_CATEGORIES = CATEGORY_TREE.map(
  (node) => node.slug
) as CategorySlug[];

const _categoryLabels: Record<string, CanonicalCategoryLabel> = {};
CATEGORY_TREE.forEach((node) => {
  _categoryLabels[node.slug] = node.label;
});
export const CATEGORY_LABELS = _categoryLabels as Record<CategorySlug, CanonicalCategoryLabel>;
