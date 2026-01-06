// src/lib/categoryInference.ts
// Ingestion-time category inference for product imports
// Reuses existing canonical category slugs and synonym logic

import { CATEGORY_SYNONYMS, type CategoryKey } from '@/config/categoryFilters';

export interface IngestionCategoryInput {
  title?: string | null;
  description?: string | null;
  campaignName?: string | null;   // e.g. "manukashop.ro"
  explicitCategorySlug?: string | null; // if there is a column for it
}

/**
 * Infers canonical category slug from ingestion data using existing synonym logic.
 * 
 * Rule priorities:
 * 1. If explicitCategorySlug is a valid CategoryKey → return that
 * 2. If campaignName matches known wellness/supplement campaigns → return default
 * 3. Use existing synonym logic to match title/description against known categories
 * 4. Return null if no match (better than random guess)
 */
export function inferCategorySlugFromIngestion(input: IngestionCategoryInput): CategoryKey | null {
  const { title, description, campaignName, explicitCategorySlug } = input;
  
  // Rule 1: Explicit category slug validation
  if (explicitCategorySlug) {
    const normalizedSlug = explicitCategorySlug.trim();
    // Check if it's a valid CategoryKey
    if (Object.keys(CATEGORY_SYNONYMS).includes(normalizedSlug)) {
      return normalizedSlug as CategoryKey;
    }
  }

  // Rule 2: Campaign-specific defaults
  if (campaignName) {
    const campaignLower = campaignName.toLowerCase();
    
    // ManukaShop and similar wellness campaigns → Wellness & Supplements
    if (campaignLower.includes('manuka') || 
        campaignLower.includes('manukashop') ||
        campaignLower.includes('honey') ||
        campaignLower.includes('supplement') ||
        campaignLower.includes('wellness')) {
      return 'Wellness & Supplements';
    }
    
    // Personal care campaigns → Personal Care
    if (campaignLower.includes('cosmetic') ||
        campaignLower.includes('beauty') ||
        campaignLower.includes('skin') ||
        campaignLower.includes('cream')) {
      return 'Personal Care';
    }
  }

  // Rule 3: Use existing synonym logic on title and description
  const searchableText = [
    title || '',
    description || ''
  ].join(' ').toLowerCase();

  // Match against each category's synonyms
  for (const [categoryKey, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (searchableText.includes(synonym.toLowerCase())) {
        return categoryKey as CategoryKey;
      }
    }
  }

  // Rule 4: No match found
  return null;
}

/**
 * Helper function to check if a string is a valid CategoryKey
 */
export function isValidCategoryKey(slug: string): slug is CategoryKey {
  return Object.keys(CATEGORY_SYNONYMS).includes(slug);
}
