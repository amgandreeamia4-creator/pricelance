import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Sample Phone Cases:');
  const cases = await prisma.product.findMany({ where: { category: 'Phone Cases & Protection' }, take: 5 });
  for (const p of cases) {
    console.log({ id: p.id, name: p.name, category: p.category });
  }

  console.log('\nSample Phones:');
  const phones = await prisma.product.findMany({ where: { category: 'Phones' }, take: 5 });
  for (const p of phones) {
    console.log({ id: p.id, name: p.name, category: p.category });
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
