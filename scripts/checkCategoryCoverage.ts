import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { CATEGORY_TREE, type CategorySlug } from '../src/config/categories';

async function main() {
  console.log('\n=== Category Coverage Check ===\n');
  console.log('Checking: DB category values vs. CategorySlug → Label mapping\n');

  const results: {
    slug: CategorySlug;
    dbLabel: string;
    count: number;
  }[] = [];

  // Test each canonical category
  for (const node of CATEGORY_TREE) {
    const count = await prisma.product.count({
      where: {
        category: node.label,
      },
    });

    results.push({
      slug: node.slug,
      dbLabel: node.label,
      count,
    });
  }

  // Sort by count descending
  results.sort((a, b) => b.count - a.count);

  // Print table
  console.table(results);

  // Summary
  const totalProducts = results.reduce((sum, r) => sum + r.count, 0);
  const populatedCategories = results.filter(r => r.count > 0).length;
  const emptyCategories = results.filter(r => r.count === 0).length;

  console.log('\n=== Summary ===');
  console.log(`Total products: ${totalProducts}`);
  console.log(`Categories with data: ${populatedCategories}/17`);
  console.log(`Empty categories: ${emptyCategories}/17`);
  
  if (emptyCategories > 0) {
    console.log('\nEmpty categories:');
    results.filter(r => r.count === 0).forEach(r => {
      console.log(`  - ${r.slug} (looking for DB label: "${r.dbLabel}")`);
    });
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
