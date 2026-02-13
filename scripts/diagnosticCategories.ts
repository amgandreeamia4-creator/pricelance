import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
  console.log('\n=== Database Category Values Diagnostic ===\n');

  // Get all unique category values in the database
  const rawCategories = await prisma.product.findMany({
    distinct: ['category'],
    select: { category: true },
  });

  console.log('Unique category values in database:');
  rawCategories.forEach((row) => {
    console.log(`  "${row.category}"`);
  });

  console.log('\n=== Count by exact value (case-sensitive) ===\n');
  const counts = await Promise.all(
    rawCategories.map(async (row) => {
      const count = await prisma.product.count({
        where: {
          category: row.category, // Exact match, no mode
        },
      });
      return { category: row.category, count };
    })
  );

  counts.sort((a, b) => b.count - a.count);
  counts.forEach((row) => {
    console.log(`${String(row.count).padStart(6)} products: "${row.category}"`);
  });

  const total = counts.reduce((sum, c) => sum + c.count, 0);
  console.log(`\nTotal: ${total}`);

  // Test what API would look for
  console.log('\n=== API Query Test ===\n');
  const testLabel = 'Phones';
  const apiResult = await prisma.product.count({
    where: {
      category: { equals: testLabel, mode: 'insensitive' },
    },
  });
  console.log(`API looking for "${testLabel}" (case-insensitive): ${apiResult} products`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
