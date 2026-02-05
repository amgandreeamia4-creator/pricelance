import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CATEGORY_TREE } from '../src/config/categories';

const prisma = new PrismaClient();

async function main() {
  const canonicalLabels = CATEGORY_TREE.map((c) => c.label);

  console.log('Canonical labels:', canonicalLabels.join(', '));

  // Group by category and get counts using raw SQL for compatibility
  const groups: { category: string | null; cnt: number }[] = await prisma.$queryRaw`
    SELECT "category", COUNT(*)::int as cnt
    FROM "Product"
    GROUP BY "category"
    ORDER BY cnt DESC
  `;

  const nonCanonical: { category: string | null; count: number }[] = [];

  for (const g of groups) {
    const cat = g.category as string | null;
    const count = g.cnt;
    const displayCat = cat === null ? '<null>' : cat;

    console.log('\n=== CATEGORY:', `${displayCat} (${count} products)` , '===');

    // Fetch a few sample products for this category
    const samples = await prisma.product.findMany({
      where: { category: cat },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        displayName: true,
        description: true,
        source: true,
        externalId: true,
        listings: {
          take: 3,
          select: {
            id: true,
            affiliateProgram: true,
            affiliateProvider: true,
            source: true,
          },
        },
      },
    });

    for (const p of samples) {
      console.log('-', {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        primaryCategory: p.primaryCategory,
        source: p.source,
        externalId: p.externalId,
        listings: p.listings,
      });
    }

    if (cat === null || !canonicalLabels.includes(cat)) {
      nonCanonical.push({ category: cat, count });
    }
  }

  // Summary
  console.log('\n--- Summary: Non-canonical categories found ---');
  if (nonCanonical.length === 0) {
    console.log('All DB categories are canonical.');
  } else {
    for (const n of nonCanonical) {
      console.log(`- ${n.category ?? '<null>'}: ${n.count}`);
    }
  }
}

main()
  .catch((err) => {
    console.error('Error during inspection:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
