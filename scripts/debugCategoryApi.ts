import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { dbCategoryFromSlug } from '../src/config/categories';

const prisma = new PrismaClient();

const slugs = [
  'phones',
  'monitors',
  'kitchen',
  'home-garden',
  'laptops',
  'tv-display',
] as const;

async function main() {
  console.log('\n=== debugCategoryApi ===\n');

  for (const slug of slugs) {
    const label = dbCategoryFromSlug(slug) ?? null;
    const prismaCount = label
      ? await prisma.product.count({ where: { category: label } })
      : 0;

    let apiTotal: number | null = null;
    try {
      const res = await fetch(`http://localhost:3000/api/products?categorySlug=${encodeURIComponent(slug)}&limit=5`);
      if (res.ok) {
        const json = await res.json();
        apiTotal = typeof json.total === 'number' ? json.total : NaN;
      } else {
        console.error(`API request for ${slug} returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error(`Fetch error for ${slug}:`, err?.message ?? err);
      apiTotal = null;
    }

    console.log(`slug=${slug} label=${String(label)} prismaCount=${prismaCount} apiTotal=${String(apiTotal)}`);
  }

  await prisma.$disconnect();
  console.log('\n=== done ===\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
