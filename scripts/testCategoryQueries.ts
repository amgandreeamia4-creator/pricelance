import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { dbCategoryFromSlug, type CategorySlug } from '../src/config/categories';

async function testCategoryQuery(slug: CategorySlug) {
  const label = dbCategoryFromSlug(slug);
  if (!label) {
    console.log(`❌ ${slug}: unknown slug`);
    return;
  }

  const count = await prisma.product.count({
    where: {
      category: { equals: label, mode: 'insensitive' },
    },
  });

  // Try to fetch some products
  const products = await prisma.product.findMany({
    where: {
      category: { equals: label, mode: 'insensitive' },
    },
    select: { id: true, name: true, category: true },
    take: 3,
  });

  const status = count > 0 ? '✅' : '❌';
  console.log(`${status} ${slug.padEnd(25)} → "${label.padEnd(26)}" = ${count} products`);
  
  if (products.length > 0) {
    products.forEach(p => {
      console.log(`     Sample: "${p.name}" (category: "${p.category}")`);
    });
  }
}

async function main() {
  console.log('\n=== Direct API Query Simulation ===\n');
  
  const allSlugs: CategorySlug[] = [
    'phones',
    'laptops',
    'monitors',
    'tv-display',
    'headphones-audio',
    'keyboards-mice',
    'tablets',
    'smartwatches',
    'phone-cases-protection',
    'personal-care',
    'small-appliances',
    'wellness-supplements',
    'gifts-lifestyle',
    'books-media',
    'toys-games',
    'home-garden',
    'kitchen',
  ];

  for (const slug of allSlugs) {
    await testCategoryQuery(slug);
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
