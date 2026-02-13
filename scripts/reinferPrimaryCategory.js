// scripts/reinferPrimaryCategory.js

import 'dotenv/config.js';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CATEGORY_RULES = [
  {
    category: 'Laptops',
    keywords: [
      'laptop',
      'laptops',
      'notebook',
      'notebooks',
      'ultrabook',
      'gaming laptop',
      'macbook',
    ],
  },
  {
    category: 'Phones',
    keywords: [
      'phone',
      'phones',
      'smartphone',
      'smartphones',
      'mobile',
      'telefon',
      'iphone',
      'galaxy',
      'xiaomi',
      'redmi',
    ],
  },
  {
    category: 'Headphones & Audio',
    keywords: [
      'headphone',
      'headphones',
      'headset',
      'earbuds',
      'earphones',
      'casti',
      'audio',
      'soundcore',
      'airpods',
    ],
  },
  {
    category: 'Monitors',
    keywords: ['monitor', 'monitors', 'display', 'screen'],
  },
  {
    category: 'Keyboards & Mice',
    keywords: [
      'keyboard',
      'keyboards',
      'mouse',
      'mice',
      'gaming keyboard',
      'gaming mouse',
    ],
  },
];

// Infer a primary category from the product text
const NEGATIVE_KEYWORDS = {
  Phones: [
    'case',
    'cover',
    'husa',
    'charger',
    'cable',
    'adapter',
    'power bank',
    'battery',
    'protector',
    'screen protector',
    'folie',
    'holder',
    'mount',
    'dock',
    'stand',
  ],
  Laptops: [
    'sleeve',
    'bag',
    'backpack',
    'stand',
    'dock',
    'cooling pad',
  ],
  'Headphones & Audio': [
    'case',
    'cover',
  ],
};

function inferPrimaryCategory(product) {
  const text = [
    product.primaryCategory || '',
    product.category || '',
    product.name || '',
    product.displayName || '',
    product.description || '',
  ]
    .join(' ')
    .toLowerCase();

  // If we already have a primaryCategory, keep it
  if (product.primaryCategory && product.primaryCategory.trim()) {
    return product.primaryCategory;
  }

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(kw.toLowerCase())) {
        const negatives = NEGATIVE_KEYWORDS[rule.category] || [];
        const hasNegative = negatives.some((neg) => text.includes(neg.toLowerCase()));
        if (hasNegative) {
          // Looks like an accessory for this category; skip
          continue;
        }

        return rule.category;
      }
    }
  }

  // No match -> leave as null for now
  return null;
}

async function main() {
  const batchSize = 500;
  let skip = 0;
  let totalUpdated = 0;

  while (true) {
    const products = await prisma.product.findMany({
      skip,
      take: batchSize,
    });

    if (!products.length) {
      break;
    }

    console.log(`Fetched batch: ${products.length} (skip=${skip})`);

    for (const product of products) {
      const inferred = inferPrimaryCategory(product);

      if (!inferred) {
        continue;
      }

      if (product.primaryCategory === inferred) {
        continue;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { primaryCategory: inferred },
      });

      totalUpdated += 1;
    }

    skip += batchSize;
  }

  console.log(`Done. Total products updated: ${totalUpdated}`);
}

main()
  .catch((err) => {
    console.error('Error during primaryCategory backfill:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
