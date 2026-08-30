// src/lib/categories.ts
// Central configuration for categories, slugs and subcategories

import type { CategoryKey } from '@/config/categoryFilters';

export type CategorySlug =
  | 'laptops'
  | 'phones'
  | 'monitors'
  | 'headphones-audio'
  | 'keyboards-mice'
  | 'tv-display'
  | 'tablets'
  | 'smartwatches'
  | 'home-garden'
  | 'personal-care'
  | 'small-appliances'
  | 'wellness-supplements'
  | 'gifts-lifestyle'
  | 'books-media'
  | 'toys-games'
  | 'kitchen';

export interface CategoryConfig {
  slug: CategorySlug;
  categoryKey: CategoryKey;
  nameRo: string;
  h1: string;
  descriptionParagraphs: string[];
}

// Helper to make slug matching more robust and SAFE
function normalizeSlug(slug: string | null | undefined): string {
  if (typeof slug !== 'string') return '';
  return slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    slug: 'laptops',
    categoryKey: 'Laptops',
    nameRo: 'Laptops',
    h1: 'Compare laptop prices',
    descriptionParagraphs: [
      'Find current laptop offers from leading retailers and compare gaming, business, and ultrabook options in one place.',
      'Review key specifications and choose the right device for your budget and needs.',
    ],
  },
  {
    slug: 'phones',
    categoryKey: 'Phones',
    nameRo: 'Phones',
    h1: 'Compare phone prices',
    descriptionParagraphs: [
      'Explore the latest smartphones and compare offers from major retailers in one place.',
      'Use detailed price and specification comparisons to find the right device for your needs.',
    ],
  },
  {
    slug: 'monitors',
    categoryKey: 'Monitors',
    nameRo: 'Monitors',
    h1: 'Compare monitor prices',
    descriptionParagraphs: [
      'Compare prices on monitors for gaming, office, and professional design use.',
      'Choose the ideal display based on size, resolution, and refresh rate.',
    ],
  },
  {
    slug: 'headphones-audio',
    categoryKey: 'Headphones & Audio',
    nameRo: 'Headphones & Audio',
    h1: 'Compare headphones and audio gear',
    descriptionParagraphs: [
      'Find the best headphones, speakers, and audio gear at competitive prices.',
      'Discover premium audio options for music, gaming, and calls.',
    ],
  },
  {
    slug: 'keyboards-mice',
    categoryKey: 'Keyboards & Mice',
    nameRo: 'Keyboards & Mice',
    h1: 'Compare keyboards and mice',
    descriptionParagraphs: [
      'Compare prices on mechanical keyboards, membrane boards, and gaming or office mice.',
      'Choose from a wide range of trusted brands and form factors.',
    ],
  },
  {
    slug: 'tv-display',
    categoryKey: 'TV & Display',
    nameRo: 'TV & Display',
    h1: 'Compare TV and display prices',
    descriptionParagraphs: [
      'Explore the latest Smart TVs, 4K displays, and OLED models in one place.',
      'Compare features, screen size, and smart capabilities to find the right option.',
    ],
  },
  {
    slug: 'tablets',
    categoryKey: 'Tablets',
    nameRo: 'Tablets',
    h1: 'Compare tablet prices',
    descriptionParagraphs: [
      'Compare prices on iPad, Android, and Windows tablets for work, entertainment, or education.',
      'Browse a wide range of tablet options with different specifications and sizes.',
    ],
  },
  {
    slug: 'smartwatches',
    categoryKey: 'Smartwatches',
    nameRo: 'Smartwatches',
    h1: 'Compare smartwatch prices',
    descriptionParagraphs: [
      'Discover the latest smartwatches and compare prices from major retailers.',
      'Choose a wearable that fits your fitness, notifications, and tracking needs.',
    ],
  },
  {
    slug: 'home-garden',
    categoryKey: 'Home & Garden',
    nameRo: 'Home & Garden',
    h1: 'Compare Home & Garden prices',
    descriptionParagraphs: [
      'Browse deals on home and garden products and compare prices on furniture, decor, and tools.',
      'Upgrade your space with quality products at competitive prices.',
    ],
  },
  {
    slug: 'personal-care',
    categoryKey: 'Personal Care',
    nameRo: 'Personal Care',
    h1: 'Compare personal care prices',
    descriptionParagraphs: [
      'Discover personal care products at competitive prices across major retailers.',
      'Choose quality items for beauty, grooming, and everyday wellness.',
    ],
  },
  {
    slug: 'small-appliances',
    categoryKey: 'Small Appliances',
    nameRo: 'Small Appliances',
    h1: 'Compare small appliance prices',
    descriptionParagraphs: [
      'Compare prices on small appliances for the kitchen and home.',
      'Find mixers, blenders, toasters, and other everyday essentials.',
    ],
  },
  {
    slug: 'wellness-supplements',
    categoryKey: 'Wellness & Supplements',
    nameRo: 'Wellness & Supplements',
    h1: 'Compare wellness and supplement prices',
    descriptionParagraphs: [
      'Discover wellness and supplement products and compare prices on vitamins, minerals, and health essentials.',
      'Choose quality products that support a healthy lifestyle and daily routine.',
    ],
  },
  {
    slug: 'gifts-lifestyle',
    categoryKey: 'Gifts & Lifestyle',
    nameRo: 'Gifts & Lifestyle',
    h1: 'Compare gifts and lifestyle products',
    descriptionParagraphs: [
      'Find thoughtful gifts and lifestyle products at competitive prices.',
      'Browse accessories, gadgets, and premium everyday items for any occasion.',
    ],
  },
  {
    slug: 'books-media',
    categoryKey: 'Books & Media',
    nameRo: 'Books & Media',
    h1: 'Compare books and media prices',
    descriptionParagraphs: [
      'Discover books, films, and music at competitive prices across major retailers.',
      'Browse a broad selection of educational, entertainment, and digital content.',
    ],
  },
  {
    slug: 'toys-games',
    categoryKey: 'Toys & Games',
    nameRo: 'Toys & Games',
    h1: 'Compare toys and games',
    descriptionParagraphs: [
      'Find educational toys and family games for every age and interest.',
      'Compare prices on puzzles, board games, and interactive play products.',
    ],
  },
  {
    slug: 'kitchen',
    categoryKey: 'Kitchen',
    nameRo: 'Kitchen',
    h1: 'Compare kitchen product prices',
    descriptionParagraphs: [
      'Explore kitchen utensils and equipment from leading retailers.',
      'Compare prices on cookware, knives, and everyday cooking essentials.',
    ],
  },
];

export function getCategoryBySlug(
  slug: string | null | undefined,
): CategoryConfig | undefined {
  if (!slug) return undefined;
  const normalized = normalizeSlug(slug);
  return CATEGORY_CONFIG.find(
    (category) => normalizeSlug(category.slug) === normalized,
  );
}

// -----------------------------------------------------------------------------
// Subcategories (existing logic kept as-is)
// -----------------------------------------------------------------------------

export type SubcategoryKey =
  | 'shampoo'
  | 'conditioner'
  | 'hair-dye'
  | 'hair-treatment'
  | 'hair-styling'
  | 'lip-balm'
  | 'toothpaste'
  | 'body-cream'
  | 'personal-other'
  | 'honey'
  | 'throat-spray'
  | 'vitamin-supplement'
  | 'general-supplement'
  | 'wellness-other';

export const SUBCATEGORY_KEYWORDS: {
  [category in CategoryKey]?: { subcategory: SubcategoryKey; keywords: string[] }[];
} = {
  // Personal Care subcategories
  'Personal Care': [
    {
      subcategory: 'shampoo',
      keywords: ['sampon', 'șampon', 'shampoo'],
    },
    {
      subcategory: 'conditioner',
      keywords: ['balsam pentru par', 'balsam de par', 'conditioner'],
    },
    {
      subcategory: 'hair-dye',
      keywords: ['vopsea', 'vopsea crema', 'vopsea par', 'hair dye', 'colorant'],
    },
    {
      subcategory: 'hair-treatment',
      keywords: [
        'tratament par',
        'masca de par',
        'hair mask',
        'hair treatment',
        'ulei de par',
        'hair oil',
        'ser pentru par',
        'hair serum',
      ],
    },
    {
      subcategory: 'hair-styling',
      keywords: [
        'spray fixativ',
        'fixativ',
        'spray texturizant',
        'mousse',
        'spuma de par',
        'gel de par',
        'hair spray',
        'styling',
      ],
    },
    {
      subcategory: 'lip-balm',
      keywords: ['balsam de buze', 'balsam pentru buze', 'lip balm'],
    },
    {
      subcategory: 'toothpaste',
      keywords: ['pasta de dinti', 'pastă de dinți', 'toothpaste'],
    },
    {
      subcategory: 'body-cream',
      keywords: [
        'crema de corp',
        'cremă de corp',
        'body lotion',
        'body cream',
        'crema pentru corp',
      ],
    },
  ],

  // Wellness & Supplements subcategories
  'Wellness & Supplements': [
    {
      subcategory: 'honey',
      keywords: ['miere', 'miere de manuka', 'manuka', 'honey'],
    },
    {
      subcategory: 'throat-spray',
      keywords: [
        'spray pentru gat',
        'spray pentru gât',
        'spray oral',
        'spray bucal',
        'throat spray',
        'oral spray',
      ],
    },
    {
      subcategory: 'vitamin-supplement',
      keywords: ['vitamina', 'vitamine', 'vitamin', 'vitamins'],
    },
    {
      subcategory: 'general-supplement',
      keywords: ['supliment', 'suplimente', 'supplement', 'capsule', 'pastile'],
    },
  ],
};
