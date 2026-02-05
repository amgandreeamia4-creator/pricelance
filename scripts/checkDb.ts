import 'dotenv/config';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.product.groupBy({
    by: ["category"],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  console.log("\n=== Product Distribution After Reinference ===\n");
  let total = 0;
  for (const cat of categories) {
    const count = cat._count.id;
    total += count;
    const pct = ((count / 32616) * 100).toFixed(1);
    console.log(`${String(cat.category || "NULL").padEnd(30)} ${String(count).padStart(6)} (${String(pct + "%").padStart(5)})`);
  }
  console.log("-".repeat(50));
  console.log(`${"TOTAL".padEnd(30)} ${String(total).padStart(6)}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
