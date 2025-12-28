import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugMonitorCategories() {
  const monitors = await prisma.product.findMany({
    where: { 
      name: { contains: 'Monitor', mode: 'insensitive' } 
    },
    select: {
      id: true,
      name: true,
      category: true,
      displayName: true,
      _count: {
        select: {
          listings: true,
        },
      },
    },
    take: 10,
  });

  console.log('Monitor products found:');
  monitors.forEach(m => {
    console.log(`- ${m.name} (${m.displayName}) | Category: "${m.category}" | Listings: ${m._count.listings}`);
  });

  await prisma.$disconnect();
}

debugMonitorCategories().catch(console.error);
