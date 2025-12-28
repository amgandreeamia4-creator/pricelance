import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMonitorSources() {
  const monitors = await prisma.product.findMany({
    where: { 
      name: { contains: 'Monitor', mode: 'insensitive' } 
    },
    select: {
      id: true,
      name: true,
      listings: {
        select: {
          id: true,
          source: true,
          price: true,
          url: true,
        },
        take: 3,
      },
    },
    take: 5,
  });

  console.log('Monitor products and their listing sources:');
  monitors.forEach(m => {
    console.log(`\n- ${m.name}`);
    if (m.listings && m.listings.length > 0) {
      m.listings.forEach(l => {
        console.log(`  Listing: source="${l.source}", price=${l.price}, url=${l.url ? 'yes' : 'no'}`);
      });
    } else {
      console.log('  No listings');
    }
  });

  await prisma.$disconnect();
}

checkMonitorSources().catch(console.error);
