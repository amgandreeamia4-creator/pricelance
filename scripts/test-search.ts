import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSearchQuery() {
  const q = "monitor";
  
  console.log(`Testing search for: "${q}"`);
  
  // Test the exact query that the API would run
  const where: Record<string, unknown> = {};
  
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { displayName: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  console.log('Prisma where clause:', JSON.stringify(where, null, 2));

  try {
    const dbProducts = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        displayName: true,
        brand: true,
        category: true,
        imageUrl: true,
        thumbnailUrl: true,
        listings: true,
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    console.log(`Found ${dbProducts.length} products:`);
    dbProducts.forEach(p => {
      console.log(`- ${p.name} | Category: ${p.category} | Listings: ${p.listings?.length || 0}`);
    });

    // Test raw count
    const totalCount = await prisma.product.count({ where });
    console.log(`Total matching products: ${totalCount}`);
    
  } catch (error) {
    console.error('Database query failed:', error);
  }

  await prisma.$disconnect();
}

testSearchQuery().catch(console.error);
