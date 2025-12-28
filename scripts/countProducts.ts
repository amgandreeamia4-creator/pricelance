import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productCount = await prisma.product.count();
  const listingCount = await prisma.listing.count();

  console.log('--- PriceLance DB counts ---');
  console.log('Products :', productCount);
  console.log('Listings :', listingCount);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
