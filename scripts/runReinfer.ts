import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { inferCategorySlugFromIngestion, type IngestionCategoryInput } from '../src/lib/categoryInference';

const prisma = new PrismaClient();

async function main() {
  const batchSize = Number(process.argv[2] || process.env.LIMIT || 1000);
  let offset = 0;
  let totalUpdated = 0;
  let totalProcessed = 0;

  console.log(`[runReinfer] starting: batch=${batchSize}`);

  while (true) {
    const products = await prisma.product.findMany({ skip: offset, take: batchSize });
    if (!products || products.length === 0) break;

    console.log(`[runReinfer] fetched ${products.length} products (offset=${offset})`);

    for (const product of products) {
      totalProcessed++;

      const ingestionInput: IngestionCategoryInput = {
        title: product.name,
        description: product.description,
        campaignName: undefined,
        explicitCategorySlug: product.category,
        feedCategory: product.category,
      };

      try {
        const newCategory = inferCategorySlugFromIngestion(ingestionInput);

        // Debug: log for a known problematic product id
        if (product.id === '001f92fa-66dc-4f74-ad17-201e287e9d94') {
          console.log('[runReinfer] DEBUG PRODUCT', {
            id: product.id,
            name: product.name,
            feedCategory: product.category,
            oldCategory: product.category,
            newCategory,
          });
        }

        if (newCategory && newCategory !== product.category) {
          await prisma.product.update({ where: { id: product.id }, data: { category: newCategory, updatedAt: new Date() } });
          totalUpdated++;
          console.log(`[runReinfer] updated ${product.id}: ${product.category} -> ${newCategory}`);
        }
      } catch (err) {
        console.error(`[runReinfer] error processing ${product.id}:`, err);
      }
    }

    offset += batchSize;
  }

  console.log(`[runReinfer] complete. processed=${totalProcessed} updated=${totalUpdated}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[runReinfer] fatal error:', err);
  process.exitCode = 1;
});
