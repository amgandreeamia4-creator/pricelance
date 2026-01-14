#!/usr/bin/env tsx

/**
 * One-time script to fix incorrect brands in existing products
 * 
 * This script:
 * 1. Finds products where brand is "Telefon" or "Laptop" (incorrect values)
 * 2. Re-detects brand from product name using the brand detector
 * 3. Updates product.brand when a known brand is found
 * 4. Logs each fix
 * 
 * Safe to run multiple times (idempotent)
 */

import { prisma } from "../src/lib/db";
import { detectBrandFromName } from "../src/lib/brandDetector";

const INCORRECT_BRANDS = ["Telefon", "Laptop"];

async function fixBrands() {
  console.log("🔧 Starting brand fix script...");
  
  try {
    // Find products with incorrect brands
    const productsToFix = await prisma.product.findMany({
      where: {
        brand: {
          in: INCORRECT_BRANDS,
        },
      },
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
      },
    });

    console.log(`📊 Found ${productsToFix.length} products with incorrect brands`);

    if (productsToFix.length === 0) {
      console.log("✅ No products need fixing");
      return;
    }

    let fixedCount = 0;
    let skippedCount = 0;

    for (const product of productsToFix) {
      const detectedBrand = detectBrandFromName(product.name);
      
      if (detectedBrand && detectedBrand !== product.brand) {
        console.log(`🔄 Fixing product: "${product.name}"`);
        console.log(`   Old brand: "${product.brand}"`);
        console.log(`   New brand: "${detectedBrand}"`);
        console.log(`   Category: "${product.category}"`);
        
        await prisma.product.update({
          where: { id: product.id },
          data: { brand: detectedBrand },
        });
        
        fixedCount++;
      } else {
        console.log(`⏭️  Skipping product: "${product.name}" (no better brand detected)`);
        skippedCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Fixed: ${fixedCount} products`);
    console.log(`   Skipped: ${skippedCount} products`);
    console.log(`   Total processed: ${productsToFix.length} products`);
    
  } catch (error) {
    console.error("❌ Error fixing brands:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixBrands()
    .then(() => {
      console.log("✅ Brand fix script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { fixBrands };
