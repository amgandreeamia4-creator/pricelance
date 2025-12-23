// src/config/categories.ts
// Canonical product categories for PriceLance v1

/**
 * Canonical category slugs used in data, API, and filtering.
 * All product categories should be one of these strings.
 */
export const CANONICAL_CATEGORIES = [
  "laptop",
  "smartphone",
  "headphones",
  "monitor",
  "keyboard-mouse",
] as const;

export type CategorySlug = (typeof CANONICAL_CATEGORIES)[number];

/**
 * Check if a string is a valid canonical category.
 */
export function isValidCategory(value: string): value is CategorySlug {
  return CANONICAL_CATEGORIES.includes(value as CategorySlug);
}

/**
 * Category display labels for UI (future use).
 */
export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  laptop: "Laptops",
  smartphone: "Smartphones",
  headphones: "Headphones",
  monitor: "Monitors",
  "keyboard-mouse": "Keyboards & Mice",
};
