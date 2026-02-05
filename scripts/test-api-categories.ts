#!/usr/bin/env npx tsx
/**
 * Test API Responses for Category Consistency
 * Verifies that /api/products returns correct categories for each slug
 */

const BASE_URL = "http://localhost:3000";

const testCategories = [
  { slug: "phones", expectedLabel: "Phones" },
  { slug: "phone-cases-protection", expectedLabel: "Phone Cases & Protection" },
  { slug: "laptops", expectedLabel: "Laptops" },
  { slug: "keyboards-mice", expectedLabel: "Keyboards & Mice" },
  { slug: "personal-care", expectedLabel: "Personal Care" },
  { slug: "kitchen", expectedLabel: "Kitchen" },
  { slug: "home-garden", expectedLabel: "Home & Garden" },
];

console.log("\n📡 API RESPONSE CATEGORY TEST\n");
console.log("=".repeat(70));

async function testCategory(slug: string, expectedLabel: string) {
  const url = `${BASE_URL}/api/products?categorySlug=${slug}&limit=3`;
  
  try {
    const response = await fetch(url);
    const data = (await response.json()) as any;
    
    const hasProducts = Array.isArray(data.products) && data.products.length > 0;
    
    if (hasProducts) {
      const firstProduct = data.products[0];
      const productCategory = firstProduct.category;
      
      const categoryMatch = productCategory === expectedLabel;
      const icon = categoryMatch ? "✓" : "❌";
      
      console.log(`\n${icon} ${slug.padEnd(25)} → ${expectedLabel}`);
      console.log(`   Found ${data.products.length} products`);
      console.log(`   First product category: "${productCategory}"`);
      
      if (!categoryMatch) {
        console.log(`   ERROR: Expected "${expectedLabel}", got "${productCategory}"`);
      }
    } else {
      console.log(
        `\n⚠️  ${slug.padEnd(25)} → ${expectedLabel} (NO PRODUCTS FOUND)`
      );
      console.log(`   Returned: ${JSON.stringify(data.products || [])}`);
    }
  } catch (error) {
    console.error(
      `\n❌ ${slug.padEnd(25)} → ${expectedLabel}`
    );
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

(async () => {
  for (const test of testCategories) {
    await testCategory(test.slug, test.expectedLabel);
  }
  
  console.log("\n" + "=".repeat(70));
  console.log("✓ API RESPONSE TEST COMPLETE");
  console.log("=".repeat(70) + "\n");
})();
