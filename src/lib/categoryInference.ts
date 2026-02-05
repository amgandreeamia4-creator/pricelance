// src/lib/categoryInference.ts
// Ingestion-time category inference for product imports
// Reuses existing canonical category slugs and synonym logic

import { CATEGORY_SYNONYMS, type CategoryKey } from '@/config/categoryFilters';
import {
  CANONICAL_CATEGORIES,
  type CanonicalCategoryLabel,
} from '@/config/categories';
import { SUBCATEGORY_KEYWORDS, type SubcategoryKey } from '@/lib/categories';

// Raw feed category name (normalized) -> canonical category label
export const FEED_CATEGORY_TO_CANONICAL: Record<string, CanonicalCategoryLabel> = {
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
  "hub usb": "Laptops",
  "hub-uri usb": "Laptops",
  "docking station": "Laptops",
  "baterii externe": "Laptops",
  "baterie externa": "Laptops",
  "power bank": "Laptops",
  "power banks": "Laptops",
  "incarcator": "Laptops",
  "incarcatoare": "Laptops",
  "cooler cpu": "Laptops",
  "coolere": "Laptops",
  "cooling fan": "Laptops",

  // Phones family
  "telefoane mobile": "Phones",
  "phone": "Phones",
  "phones": "Phones",
  "smartphone": "Phones",
  "phone flagship": "Phones",
  "incarcatoare retea gsm": "Phones",
  "incarcatoare auto gsm": "Phones",
  "incarcatoare wireless gsm": "Phones",
  "suporti gsm": "Phones",
  "selfie stick": "Phones",

  // Phone Cases & Protection
  "huse gsm dedicate": "Phone Cases & Protection",
  "huse si folii": "Phone Cases & Protection",
  "huse telefoane": "Phone Cases & Protection",
  "folii securizate gsm": "Phone Cases & Protection",
  "folii protectie telefon": "Phone Cases & Protection",
  "phone cases": "Phone Cases & Protection",
  "phone covers": "Phone Cases & Protection",
  "case for phone": "Phone Cases & Protection",

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

  // Keyboards & Mice
  "mouse": "Keyboards & Mice",
  "mouse gaming": "Keyboards & Mice",
  "mouse pad": "Keyboards & Mice",
  "mousepad": "Keyboards & Mice",
  "tastaturi": "Keyboards & Mice",
  "tastaturi gaming": "Keyboards & Mice",
  "keyboard": "Keyboards & Mice",
  "kit tastatura + mouse": "Keyboards & Mice",
  "kit tastatura si mouse": "Keyboards & Mice",
  "gamepad": "Keyboards & Mice",
  "kit gaming": "Keyboards & Mice",
  "accesorii gaming": "Keyboards & Mice",
  "controller": "Keyboards & Mice",
  "gaming chair": "Home & Garden",
  "scaune gaming": "Home & Garden",

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

export interface IngestionCategoryInput {
  title?: string | null;
  description?: string | null;
  campaignName?: string | null;   // e.g. "manukashop.ro"
  explicitCategorySlug?: string | null; // if there is a column for it
  feedCategory?: string | null; // raw feed category from existing Product.category
}

/**
 * Name-based category heuristics for products without feed category
 * Handles cases where provider category is missing but product name gives strong signal
 */
function inferCategoryFromName(productName: string): CanonicalCategoryLabel | null {
  const name = productName.toLowerCase().trim();
  
  // Phone-related (but exclude cases/covers - those are handled separately)
  if ((name.includes('telefon') || name.includes('smartphone') || name.includes('iphone') || 
       name.includes('samsung galaxy') || name.includes('google pixel')) &&
      !name.includes('hus')) {
    return 'Phones';
  }
  
  // Laptops / PCs
  if (name.includes('laptop') || name.includes('notebook') || name.includes('ultrabook') ||
      name.includes('netbook') || name.includes('macbook')) {
    return 'Laptops';
  }
  
  // Monitors (but not TVs)
  if ((name.includes('monitor') || name.includes('display')) && 
      !name.includes('tv') && !name.includes('televisor')) {
    return 'Monitors';
  }
  
  // TV & Display
  if (name.includes('tv ') || name.includes('televisor') || name.includes('television') ||
      name.includes('proiector') || name.includes('projector')) {
    return 'TV & Display';
  }
  
  // Keyboards & Mice (input devices)
  if (name.includes('mouse') || name.includes('tastatura') || name.includes('keyboard') ||
      name.includes('gamepad') || name.includes('controller') || name.includes('joystick')) {
    return 'Keyboards & Mice';
  }
  
  // Headphones & Audio
  if (name.includes('casti') || name.includes('headphones') || name.includes('earbuds') ||
      name.includes('speaker') || name.includes('boxa') || name.includes('soundbar') ||
      name.includes('audio system')) {
    return 'Headphones & Audio';
  }
  
  // Tablets
  if (name.includes('tablet') || name.includes('ipad')) {
    return 'Tablets';
  }
  
  // Smartwatches
  if (name.includes('smartwatch') || name.includes('smart watch') || 
      name.includes('fitness band') || name.includes('fitbit')) {
    return 'Smartwatches';
  }
  
  // USB Hubs / Docking Stations / Power solutions
  if (name.includes('hub') || name.includes('docking') || name.includes('charger') ||
      name.includes('power bank') || name.includes('baterie externa') || name.includes('incarcator')) {
    return 'Laptops'; // General PC accessories
  }
  
  // Personal Care
  if (name.includes('epilator') || name.includes('toothbrush') || name.includes('hair dryer') ||
      name.includes('shaver') || name.includes('trimmer') || name.includes('grooming') ||
      name.includes('masaj') || name.includes('ras')) {
    return 'Personal Care';
  }
  
  // Small Appliances
  if (name.includes('vacuum') || name.includes('aspirator') || name.includes('washing machine') ||
      name.includes('dryer') || name.includes('spalat')) {
    return 'Small Appliances';
  }
  
  // Kitchen
  if (name.includes('kettle') || name.includes('microwave') || name.includes('blender') ||
      name.includes('coffee machine') || name.includes('fierbatoare')) {
    return 'Kitchen';
  }
  
  // Home & Garden (furniture, tools, lamps)
  if (name.includes('chair') || name.includes('desk') || name.includes('lamp') ||
      name.includes('furniture') || name.includes('scaun') || name.includes('tool') ||
      name.includes('garden')) {
    return 'Home & Garden';
  }
  
  // Books & Media / Office supplies
  if (name.includes('notebook') || name.includes('stationery') || name.includes('backpack') ||
      name.includes('e-book') || name.includes('ebook')) {
    // Special case: "notebook" without context usually means laptop
    if (!name.includes('stationery') && !name.includes('journal')) {
      return 'Laptops';
    }
    return 'Books & Media';
  }
  
  // Wellness & Supplements
  if (name.includes('supplement') || name.includes('vitamin') || name.includes('scale') ||
      name.includes('blood pressure') || name.includes('cant')) {
    return 'Wellness & Supplements';
  }
  
  return null;
}

/**
 * Infers canonical category label from ingestion data using existing synonym logic.
 * 
 * Rule priorities:
 * 1. If explicitCategorySlug is a valid CanonicalCategoryLabel → return that
 * 2. Early rule: phone cases/covers → "Phone Cases & Protection"
 * 3. Feed category mapping
 * 4. Campaign-specific defaults
 * 5. Name-based heuristics (NEW - for NULL categories)
 * 6. Use existing synonym logic to match title/description
 * 7. As fallback, assign to Gifts & Lifestyle if still unmatched
 */
export function inferCategorySlugFromIngestion(input: IngestionCategoryInput): CanonicalCategoryLabel | null {
  const { title, description, campaignName, explicitCategorySlug, feedCategory } = input;
  
  // Note: explicitCategorySlug is intentionally NOT honored here yet
  // because we want stronger, early rules (e.g. phone-case detection)
  // to override existing database values when they clearly indicate
  // a different canonical category.

  // Rule 1.5: HARD RULE - Phone cases / covers detection
  // Must come early, before generic Phones rules, to avoid miscategorization
  const nameRaw = (title ?? "").toLowerCase();
  const feedRaw = (feedCategory ?? "").toLowerCase();

  const looksLikePhoneCaseByName =
    nameRaw.startsWith("husa ") ||
    nameRaw.startsWith("husă ") ||
    nameRaw.includes(" husa ") ||
    nameRaw.includes(" husă ") ||
    nameRaw.includes(" huse ") ||
    nameRaw.includes(" case ") ||
    nameRaw.includes(" cover ") ||
    nameRaw.includes(" folie ");

  const looksLikePhoneCaseByFeed =
    feedRaw.includes("husa") ||
    feedRaw.includes("husă") ||
    feedRaw.includes("huse") ||
    feedRaw.includes("case") ||
    feedRaw.includes("cover") ||
    feedRaw.includes("folii") ||
    feedRaw.includes("protectie");

  if (looksLikePhoneCaseByName || looksLikePhoneCaseByFeed) {
      // DEBUG: Log phone case detections
      if (nameRaw.includes("husa") || nameRaw.includes("husă")) {
        console.log(`[inference] 🔵 PHONE CASE DETECTED by name: "${title}"`);
      }
    return "Phone Cases & Protection";
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

    // Rule 3.5: Honor explicitCategorySlug (but only after stronger early rules ran)
    if (explicitCategorySlug) {
      const normalizedSlug = explicitCategorySlug.trim();
      if (Object.keys(CATEGORY_SYNONYMS).includes(normalizedSlug)) {
        return normalizedSlug as CategoryKey;
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

  // Rule 5: Name-based heuristics (NEW - handles NULL categories)
  if (title) {
    const nameInferred = inferCategoryFromName(title);
    if (nameInferred) {
      return nameInferred;
    }
  }

  // Rule 6: As absolute fallback, assign unmatched products to Gifts & Lifestyle
  // This ensures NO product has NULL category
  // (Better to be in a general category than have NULL which breaks the UI)
  return 'Gifts & Lifestyle';
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
