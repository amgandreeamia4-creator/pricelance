import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phones = await prisma.product.count({ where: { category: 'Phones' } });
  const cases = await prisma.product.count({ where: { category: 'Phone Cases & Protection' } });
  console.log('Counts:');
  console.log('  Phones:', phones);
  console.log('  Phone Cases & Protection:', cases);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
