#!/usr/bin/env tsx

import { randomUUID } from "crypto";
import { prisma } from "../src/lib/db";

type SeedLaptop = {
  brand: string;
  modelName: string;
  displayName: string;
  category: string;
};

// Initial curated laptop set for the "golden lane". Extend this list to 20–30
// models over time as coverage grows.
const LAPTOPS: SeedLaptop[] = [
  {
    brand: "Lenovo",
    modelName: "IdeaPad Slim 3 15AMN8",
    displayName: "Lenovo IdeaPad Slim 3 15",
    category: "laptop",
  },
  {
    brand: "ASUS",
    modelName: "Vivobook Go 15 E1504",
    displayName: "ASUS Vivobook Go 15",
    category: "laptop",
  },
  {
    brand: "HP",
    modelName: "15s-eq Ryzen 5",
    displayName: "HP 15 (Ryzen 5)",
    category: "laptop",
  },
  {
    brand: "Acer",
    modelName: "Aspire 5 A515-58M",
    displayName: "Acer Aspire 5",
    category: "laptop",
  },
  {
    brand: "Dell",
    modelName: "Inspiron 15 3520",
    displayName: "Dell Inspiron 15",
    category: "laptop",
  },
  {
    brand: "Lenovo",
    modelName: "Legion 5 15ARH7",
    displayName: "Lenovo Legion 5",
    category: "laptop",
  },
  {
    brand: "ASUS",
    modelName: "TUF Gaming A15 FA506",
    displayName: "ASUS TUF Gaming A15",
    category: "laptop",
  },
  {
    brand: "Apple",
    modelName: "MacBook Air 13 M2",
    displayName: "Apple MacBook Air 13\"",
    category: "laptop",
  },
  {
    brand: "Dell",
    modelName: "XPS 13 9315",
    displayName: "Dell XPS 13",
    category: "laptop",
  },
  {
    brand: "Lenovo",
    modelName: "ThinkPad E14 Gen 5",
    displayName: "Lenovo ThinkPad E14",
    category: "laptop",
  },
  {
    brand: "ASUS",
    modelName: "ROG Zephyrus G14 GA402",
    displayName: "ASUS ROG Zephyrus G14",
    category: "laptop",
  },
];

async function main() {
  console.log("[seed-laptops] Seeding laptop products...");

  let createdCount = 0;
  let updatedCount = 0;

  for (const laptop of LAPTOPS) {
    const { brand, modelName, displayName, category } = laptop;

    try {
      const existing = await prisma.product.findFirst({
        where: {
          name: modelName,
          brand,
          category,
        },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: modelName,
            displayName,
            brand,
            category,
            updatedAt: new Date(),
          },
        });

        updatedCount += 1;
        console.log(
          `[seed-laptops] Updated product: ${brand} ${displayName} (${modelName})`,
        );
      } else {
        await prisma.product.create({
          data: {
            id: randomUUID(),
            name: modelName,
            displayName,
            brand,
            category,
            updatedAt: new Date(),
          },
        });

        createdCount += 1;
        console.log(
          `[seed-laptops] Created product: ${brand} ${displayName} (${modelName})`,
        );
      }
    } catch (error) {
      console.error(
        `[seed-laptops] Failed to upsert product ${brand} ${displayName} (${modelName})`,
        error,
      );
    }
  }

  console.log("[seed-laptops] Done seeding laptop products.");
  console.log(
    `[seed-laptops] Summary: ${createdCount} created, ${updatedCount} updated.`,
  );
}

main()
  .catch((e) => {
    console.error("[seed-laptops] Unexpected error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

