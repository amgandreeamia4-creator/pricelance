// src/lib/categoryInference.ts
// Ingestion-time category inference for product imports
// Reuses existing canonical category slugs and synonym logic

// Raw feed category name (normalized) -> canonical CategoryKey
export const FEED_CATEGORY_TO_CANONICAL: Record<string, CategoryKey> = {
  // Laptops family
  "notebook": "Laptops",
  "notebook / laptop": "Laptops",
  "laptopuri": "Laptops",
  "laptop": "Laptops",
  "laptops": "Laptops",
  "genti notebook": "Laptops",
  "mini sisteme pc": "Laptops",
  "sisteme pc garage": "Laptops",
  "sisteme brand": "Laptops",
  "all in one pc": "Laptops",

  // Phones family
  "telefoane mobile": "Phones",
  "phone": "Phones",
  "phones": "Phones",
  "smartphone": "Phones",
  "phone flagship": "Phones",
  "huse gsm dedicate": "Phones",
  "incarcatoare retea gsm": "Phones",
  "incarcatoare auto gsm": "Phones",
  "incarcatoare wireless gsm": "Phones",
  "folii securizate gsm": "Phones",
  "folii protectie telefon": "Phones",
  "accesorii smartphone": "Phones",
  "suporti gsm": "Phones",
  "selfie stick": "Phones",

  // Monitors / TV & Display
  "monitoare lcd si led": "Monitors",
  "monitoare led": "Monitors",
  "monitor": "Monitors",
  "monitor gaming": "Monitors",
  "televizoare": "TV & Display",
  "televizoare led": "TV & Display",
  "tv": "TV & Display",
  "video recorder": "TV & Display",
  "ecrane de proiectie": "TV & Display",
  "videoproiectoare": "TV & Display",

  // Headphones & Audio
  "casti": "Headphones & Audio",
  "casti over-head": "Headphones & Audio",
  "casti gaming": "Headphones & Audio",
  "headphones": "Headphones & Audio",
  "audio headphones": "Headphones & Audio",
  "boxe": "Headphones & Audio",
  "boxe portabile": "Headphones & Audio",
  "boxe auto": "Headphones & Audio",
  "home cinema & audio": "Headphones & Audio",
  "sisteme home cinema": "Headphones & Audio",
  "media-playere": "Headphones & Audio",

  // Keyboards & Mouse
  "mouse": "Keyboards & Mouse",
  "mouse gaming": "Keyboards & Mouse",
  "mouse pad": "Keyboards & Mouse",
  "mousepad": "Keyboards & Mouse",
  "tastaturi": "Keyboards & Mouse",
  "tastaturi gaming": "Keyboards & Mouse",
  "keyboard": "Keyboards & Mouse",
  "kit tastatura + mouse": "Keyboards & Mouse",
  "kit tastatura si mouse": "Keyboards & Mouse",
  "gamepad": "Keyboards & Mouse",
  "kit gaming": "Keyboards & Mouse",
  "accesorii gaming": "Keyboards & Mouse",

  // Tablets
  "tablete": "Tablets",
  "tablete grafice": "Tablets",
  "tablet": "Tablets",
  "accesorii tablete": "Tablets",
  "accesorii tablete grafice": "Tablets",

  // Smartwatches / wearables
  "smartwatch": "Smartwatches",
  "smart watch": "Smartwatches",
  "curele smartwatch": "Smartwatches",
  "accesorii smartwatch": "Smartwatches",
  "bratari fitness": "Smartwatches",
  "fitness & wearables": "Smartwatches",

  // Personal Care
  "diverse cosmetice": "Personal Care",
  "sampon si balsam": "Personal Care",
  "periute de dinti electrice": "Personal Care",
  "electric toothbrush": "Personal Care",
  "ingrijire dentara": "Personal Care",
  "beauty haircare": "Personal Care",
  "beauty skincare": "Personal Care",
  "beauty bodycare": "Personal Care",
  "beauty hair styling": "Personal Care",
  "beauty grooming men": "Personal Care",
  "beauty makeup": "Personal Care",
  "beauty oral care": "Personal Care",
  "beauty deodorant": "Personal Care",
  "aparate masaj": "Personal Care",
  "aparate de ras electrice": "Personal Care",
  "aparate de ras": "Personal Care",
  "aparate de tuns": "Personal Care",
  "masini de tuns": "Personal Care",
  "epilator": "Personal Care",
  "epilatoare": "Personal Care",
  "uscatoare de par": "Personal Care",
  "hair dryer": "Personal Care",
  "hair styler": "Personal Care",
  "hair straightener": "Personal Care",
  "hair clippers": "Personal Care",

  // Wellness & Supplements
  "supplements vitamins & minerals": "Wellness & Supplements",
  "supplements omega 3 & fish oil": "Wellness & Supplements",
  "supplements immunity & cold": "Wellness & Supplements",
  "supplements digestive & probiotics": "Wellness & Supplements",
  "supplements magnesium & sleep": "Wellness & Supplements",
  "blood pressure monitor": "Wellness & Supplements",
  "bathroom scale": "Wellness & Supplements",
  "cantare corporale": "Wellness & Supplements",

  // Small Appliances & Kitchen
  "aspiratoare": "Small Appliances",
  "vacuum": "Small Appliances",
  "robot vacuum": "Small Appliances",
  "masini de spalat rufe": "Small Appliances",
  "masini de spalat vase": "Small Appliances",
  "uscatoare de rufe": "Small Appliances",
  "small kitchen appliances": "Kitchen",
  "diverse electrocasnice mici": "Kitchen",
  "fierbatoare": "Kitchen",
  "electric kettle": "Kitchen",
  "microwave": "Kitchen",
  "cuptoare cu microunde": "Kitchen",
  "blendere": "Kitchen",
  "blendere & tocatoare": "Kitchen",
  "mixere": "Kitchen",
  "sandwich maker": "Kitchen",
  "prajitoare de paine": "Kitchen",
  "gratare electrice": "Kitchen",
  "multicooker": "Kitchen",
  "roboti de bucatarie": "Kitchen",
  "coffee machine": "Kitchen",
  "espressoare cafea": "Kitchen",
  "rasnite cafea": "Kitchen",

  // Toys & Games
  "jucarii": "Toys & Games",
  "kids toys": "Toys & Games",
  "seturi de constructie": "Toys & Games",
  "board game": "Toys & Games",
  "jocuri consola": "Toys & Games",
  "console jocuri": "Toys & Games",
  "console": "Toys & Games",

  // Home & Garden / Bedding
  "home & bedding": "Home & Garden",
  "bedding": "Home & Garden",
  "home mattresses": "Home & Garden",
  "paturi copii": "Home & Garden",
  "scaune auto copii": "Home & Garden",
  "carucioare copii": "Home & Garden",
  "triciclete copii": "Home & Garden",
  "pompe de san": "Home & Garden",
  "home storage & organization": "Home & Garden",
  "home lighting & lamps": "Home & Garden",
  "home office chairs & desks": "Home & Garden",

  // Books & Media / Office & School
  "stationery notebooks & journals": "Books & Media",
  "stationery pens & markers": "Books & Media",
  "stationery office supplies": "Books & Media",
  "office & school": "Books & Media",
  "school backpacks & school bags": "Books & Media",
  "school art & craft supplies": "Books & Media",
  "ebook reader": "Books & Media",
  "e-book reader": "Books & Media",

  // Groceries / Fashion / misc -> Gifts & Lifestyle (for now)
  "pet food": "Gifts & Lifestyle",
  "coffee": "Gifts & Lifestyle",
  "grocery coffee": "Gifts & Lifestyle",
  "groceries pasta": "Gifts & Lifestyle",
  "groceries pantry": "Gifts & Lifestyle",
  "groceries oils": "Gifts & Lifestyle",
  "groceries cereals": "Gifts & Lifestyle",
  "grocery bio & organic snacks": "Gifts & Lifestyle",
  "grocery bio & organic breakfast": "Gifts & Lifestyle",
  "fashion sneakers & casual shoes": "Gifts & Lifestyle",
  "fashion dresses & skirts": "Gifts & Lifestyle",
};

/**
 * Normalizes a feed category string for lookup
 */
function normalizeFeedCategory(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .normalize('NFD') // normalize unicode
    .replace(/[\u0300-\u036f]/g, ''); // remove diacritics
}

import { CATEGORY_SYNONYMS, type CategoryKey } from '@/config/categoryFilters';
import { SUBCATEGORY_KEYWORDS, type SubcategoryKey } from '@/lib/categories';

export interface IngestionCategoryInput {
  title?: string | null;
  description?: string | null;
  campaignName?: string | null;   // e.g. "manukashop.ro"
  explicitCategorySlug?: string | null; // if there is a column for it
  feedCategory?: string | null; // raw feed category from existing Product.category
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
  const { title, description, campaignName, explicitCategorySlug, feedCategory } = input;
  
  // Rule 1: Explicit category slug validation
  if (explicitCategorySlug) {
    const normalizedSlug = explicitCategorySlug.trim();
    // Check if it's a valid CategoryKey
    if (Object.keys(CATEGORY_SYNONYMS).includes(normalizedSlug)) {
      return normalizedSlug as CategoryKey;
    }
  }

  // Rule 2: Feed category mapping (new shortcut)
  if (feedCategory) {
    const normalizedFeedCategory = normalizeFeedCategory(feedCategory);
    const mappedCategory = FEED_CATEGORY_TO_CANONICAL[normalizedFeedCategory];
    if (mappedCategory) {
      return mappedCategory;
    }
  }

  // Rule 3: Campaign-specific defaults
  if (campaignName) {
    const campaignLower = campaignName.toLowerCase();
    
    // Manuka/ManukaShop campaigns - special handling with deterministic rules
    const isManuka =
      campaignLower.includes("manuka") ||
      campaignLower.includes("manukashop");
    
    if (isManuka) {
      // Build searchable text from title and description
      const searchableText = [
        title || '',
        description || ''
      ].join(' ').toLowerCase();
      
      // Personal care keywords for Manuka products
      const personalCareKeywords = [
        "crema", "cream", "balsam", "balsam de buze",
        "lip balm", "pasta de dinti", "toothpaste",
        "gel de dus", "shower gel", "soap", "sapun",
        "spray bucal", "spray oral pentru gat", "lotune",
        "hand cream", "foot cream"
      ];
      
      // Check if product matches personal care keywords
      const isPersonalCare = personalCareKeywords.some(keyword => 
        searchableText.includes(keyword)
      );
      
      // Return deterministic category for Manuka products
      return isPersonalCare ? 'Personal Care' : 'Wellness & Supplements';
    }
    
    // Other campaign defaults (existing logic)
    if (campaignLower.includes('cosmetic') ||
        campaignLower.includes('beauty') ||
        campaignLower.includes('skin') ||
        campaignLower.includes('cream')) {
      return 'Personal Care';
    }
  }

  // Rule 4: Use existing synonym logic on title and description
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

  // Rule 5: No match found
  return null;
}

/**
 * Helper function to check if a string is a valid CategoryKey
 */
export function isValidCategoryKey(slug: string): slug is CategoryKey {
  return Object.keys(CATEGORY_SYNONYMS).includes(slug);
}

/**
 * Infer subcategory from text using keyword rules
 */
export function inferSubcategoryFromText(
  category: CategoryKey,
  title?: string | null,
  description?: string | null
): SubcategoryKey | null {
  const rules = SUBCATEGORY_KEYWORDS[category];
  if (!rules || (!title && !description)) return null;

  const text =
    ((title ?? "") + " " + (description ?? "")).toLowerCase();

  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return rule.subcategory;
      }
    }
  }

  return null;
}
