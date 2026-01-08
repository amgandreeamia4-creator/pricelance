// src/lib/categories.ts
// Central configuration for categories, slugs and subcategories

import type { CategoryKey } from '@/config/categoryFilters';

export type CategorySlug =
  | 'laptops'
  | 'phones'
  | 'monitors'
  | 'headphones-audio'
  | 'keyboards-mouse'
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
    nameRo: 'Laptopuri',
    h1: 'Compară prețuri la Laptopuri',
    descriptionParagraphs: [
      'Găsește cele mai bune oferte la laptopuri din România. Compară prețuri la notebook-uri gaming, business și ultrabookuri de la magazine de top.',
      'Vizualizează specificații tehnice, review-uri și alege laptopul potrivit pentru bugetul și nevoile tale. Prețuri actualizate în timp real.',
    ],
  },
  {
    slug: 'phones',
    categoryKey: 'Phones',
    nameRo: 'Telefoane',
    h1: 'Compară prețuri la Telefoane',
    descriptionParagraphs: [
      'Descoperă cele mai noi smartphone-uri la prețuri competitive. Compară oferte la iPhone, Samsung, Xiaomi și alte branduri populare din România.',
      'Alege telefonul perfect pentru tine cu ajutorul comparațiilor detaliate de prețuri și specificații. Oferte la telefoane noi și recondiționate.',
    ],
  },
  {
    slug: 'monitors',
    categoryKey: 'Monitors',
    nameRo: 'Monitoare',
    h1: 'Compară prețuri la Monitoare',
    descriptionParagraphs: [
      'Compară prețuri la monitoare pentru gaming, office și design profesional. Găsește cele mai bune oferte la monitoare LED, IPS și OLED.',
      'Alege monitorul ideal în funcție de diagonală, rezoluție și rată de refresh. Prețuri actualizate la monitoare de la producători de top.',
    ],
  },
  {
    slug: 'headphones-audio',
    categoryKey: 'Headphones & Audio',
    nameRo: 'Căști & Audio',
    h1: 'Compară prețuri la Căști și Echipamente Audio',
    descriptionParagraphs: [
      'Găsește cele mai bune căști, boxe și echipamente audio. Compară prețuri la căști wireless, over-ear, in-ear și sisteme audio de calitate.',
      'Descoperă oferte la branduri premium de audio pentru muzică, gaming și calls. Sunet de înaltă calitate la prețuri competitive.',
    ],
  },
  {
    slug: 'keyboards-mouse',
    categoryKey: 'Keyboards & Mouse',
    nameRo: 'Tastaturi & Mouse',
    h1: 'Compară prețuri la Tastaturi și Mouse',
    descriptionParagraphs: [
      'Compară prețuri la tastaturi mecanice, membrane și mouse-uri gaming sau office. Găsește perifericele perfecte pentru setup-ul tău.',
      'Alege din gamă variată de branduri specializate. Prețuri bune la tastaturi și mouse-uri wireless sau cu fir.',
    ],
  },
  {
    slug: 'tv-display',
    categoryKey: 'TV & Display',
    nameRo: 'TV & Display',
    h1: 'Compară prețuri la TV și Display',
    descriptionParagraphs: [
      'Descoperă cele mai noi televizoare Smart TV, 4K și OLED la prețuri excelente. Compară oferte la TV de la Samsung, LG, Sony și alți producători.',
      'Alege televizorul perfect în funcție de diagonală, tehnologie și funcționalități smart. Prețuri actualizate la TV și display-uri.',
    ],
  },
  {
    slug: 'tablets',
    categoryKey: 'Tablets',
    nameRo: 'Tablete',
    h1: 'Compară prețuri la Tablete',
    descriptionParagraphs: [
      'Compară prețuri la tablete iPad, Android și Windows. Găsește tableta potrivită pentru work, entertainment sau educație.',
      'Alege din gamă variată de tablete cu diferite diagonale și specificații. Oferte bune la tablete noi și recondiționate.',
    ],
  },
  {
    slug: 'smartwatches',
    categoryKey: 'Smartwatches',
    nameRo: 'Smartwatch',
    h1: 'Compară prețuri la Smartwatch',
    descriptionParagraphs: [
      'Descoperă cele mai noi ceasuri inteligente și smartwatch-uri. Compară prețuri la Apple Watch, Samsung Galaxy Watch și alte branduri.',
      'Alege smartwatch-ul perfect pentru fitness, notificări și tracking. Prețuri competitive la ceasuri inteligente cu funcționalități avansate.',
    ],
  },
  {
    slug: 'home-garden',
    categoryKey: 'Home & Garden',
    nameRo: 'Casă & Grădină',
    h1: 'Compară prețuri la Produse pentru Casă și Grădină',
    descriptionParagraphs: [
      'Găsește cele mai bune oferte la produse pentru casă și grădină. Compară prețuri la mobilier, decorațiuni și unelte de grădinărit.',
      'Transformă-ți casa și grădina cu produse de calitate la prețuri accesibile. Oferte variate pentru amenajare și îngrijire.',
    ],
  },
  {
    slug: 'personal-care',
    categoryKey: 'Personal Care',
    nameRo: 'Îngrijire Personală',
    h1: 'Compară prețuri la Produse de Îngrijire Personală',
    descriptionParagraphs: [
      'Descoperă produse de îngrijire personală la prețuri excelente. Compară oferte la cosmetice, aparate de îngrijire și accesorii.',
      'Alege produse de calitate pentru beauty și wellness. Prețuri bune la îngrijire facială, corporală și accesorii profesionale.',
    ],
  },
  {
    slug: 'small-appliances',
    categoryKey: 'Small Appliances',
    nameRo: 'Electrocasnice Mici',
    h1: 'Compară prețuri la Electrocasnice Mici',
    descriptionParagraphs: [
      'Compară prețuri la electrocasnice mici pentru bucătărie și casă. Găsește mixere, blendere, prăjitoare și alte aparate utile.',
      'Echipamentează-ți bucătăria cu electrocasnice moderne și eficiente. Prețuri competitive la aparate de la branduri de încredere.',
    ],
  },
  {
    slug: 'wellness-supplements',
    categoryKey: 'Wellness & Supplements',
    nameRo: 'Wellness & Suplimente',
    h1: 'Compară prețuri la Produse Wellness și Suplimente',
    descriptionParagraphs: [
      'Descoperă produse pentru wellness și suplimente nutritive. Compară prețuri la vitamine, minerale și produse pentru sănătate.',
      'Alege suplimente de calitate pentru un stil de viață sănătos. Prețuri bune la produse pentru fitness și wellbeing.',
    ],
  },
  {
    slug: 'gifts-lifestyle',
    categoryKey: 'Gifts & Lifestyle',
    nameRo: 'Cadouri & Lifestyle',
    h1: 'Compară prețuri la Cadouri și Produse Lifestyle',
    descriptionParagraphs: [
      'Găsește cadouri perfecte și produse lifestyle la prețuri excelente. Compară oferte la gadget-uri, accesorii și articole de lux.',
      'Alege cadouri inspirate pentru orice ocazie. Prețuri competitive la produse pentru un stil de viață modern și elegant.',
    ],
  },
  {
    slug: 'books-media',
    categoryKey: 'Books & Media',
    nameRo: 'Cărți & Media',
    h1: 'Compară prețuri la Cărți și Produse Media',
    descriptionParagraphs: [
      'Descoperă cărți, filme și muzică la prețuri bune. Compară oferte la bestseller-uri, manuale și produse media digitale.',
      'Alege din gamă variată de conținut educațional și entertainment. Prețuri excelente la cărți și media pentru toate gusturile.',
    ],
  },
  {
    slug: 'toys-games',
    categoryKey: 'Toys & Games',
    nameRo: 'Jucării & Jocuri',
    h1: 'Compară prețuri la Jucării și Jocuri',
    descriptionParagraphs: [
      'Găsește jucării educative și jocuri pentru toate vârstele. Compară prețuri la jocuri de societate, puzzle-uri și jucării interactive.',
      'Alege jucării sigure și educative pentru copii. Prețuri bune la jocuri pentru familie și entertainment.',
    ],
  },
  {
    slug: 'kitchen',
    categoryKey: 'Kitchen',
    nameRo: 'Bucătărie',
    h1: 'Compară prețuri la Produse pentru Bucătărie',
    descriptionParagraphs: [
      'Descoperă ustensile și echipamente pentru bucătărie. Compară prețuri la oale, tigăi, cuțite și accesorii de gătit.',
      'Echipamentează-ți bucătăria cu produse de calitate. Prețuri competitive la ustensile și accesorii pentru gătit profesional.',
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
