#!/usr/bin/env npx tsx
/**
 * Test /api/products endpoint
 */

interface TestCase {
  name: string;
  url: string;
}

const BASE_URL = "http://localhost:3000";

const testCases: TestCase[] = [
  {
    name: "Test 1: categorySlug=phones&limit=5",
    url: "/api/products?categorySlug=phones&limit=5",
  },
  {
    name: "Test 2: categorySlug=phone-cases-protection&perPage=5",
    url: "/api/products?categorySlug=phone-cases-protection&perPage=5",
  },
  {
    name: "Test 3: categorySlug=tv-display&perPage=5",
    url: "/api/products?categorySlug=tv-display&perPage=5",
  },
  {
    name: "Test 4: categorySlug=kitchen&limit=3",
    url: "/api/products?categorySlug=kitchen&limit=3",
  },
  {
    name: "Test 5: categorySlug=home-garden&limit=2",
    url: "/api/products?categorySlug=home-garden&limit=2",
  },
];

async function runTest(testCase: TestCase) {
  console.log("\n" + "=".repeat(70));
  console.log(`📋 ${testCase.name}`);
  console.log("=".repeat(70));

  try {
    const fullUrl = `${BASE_URL}${testCase.url}`;
    console.log(`URL: ${fullUrl}`);

    const res = await fetch(fullUrl);
    console.log(`HTTP Status: ${res.status}`);

    const text = await res.text();
    console.log(`Raw response (first 300 chars): ${text.slice(0, 300)}`);

    if (!text) {
      console.error("❌ Empty response");
      return;
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error(`❌ JSON parse failed: ${(e as Error).message}`);
      return;
    }

    console.log(`✅ Valid JSON`);
    console.log(`   Keys: ${Object.keys(json).join(", ")}`);

    if (!json.products) {
      console.error("❌ Missing 'products' key");
      return;
    }

    if (!Array.isArray(json.products)) {
      console.error(`❌ 'products' is not an array, got ${typeof json.products}`);
      return;
    }

    console.log(`✅ 'products' is an array with ${json.products.length} items`);

    if (json.products.length > 0) {
      const first = json.products[0];
      console.log(`   First product:`);
      console.log(`     - id: ${first.id}`);
      console.log(`     - name: ${first.name?.slice(0, 50)}`);
      console.log(`     - category: ${first.category}`);
      console.log(`     - listings: ${first.listings?.length ?? 0}`);
    }

    console.log(`   total: ${json.total}`);
    console.log(`   page: ${json.page}`);
    console.log(`   perPage: ${json.perPage}`);

    // Validate response structure
    const hasRequiredKeys = ["products", "total", "page", "perPage"].every(
      (k) => k in json
    );
    if (hasRequiredKeys) {
      console.log("✅ All required response fields present");
    } else {
      console.error(
        `❌ Missing fields. Have: ${Object.keys(json).join(", ")}`
      );
    }
  } catch (err) {
    console.error(`❌ Fetch error: ${(err as Error).message}`);
  }
}

(async () => {
  console.log("\n🚀 API PRODUCTS ENDPOINT TEST\n");

  for (const testCase of testCases) {
    await runTest(testCase);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✓ TEST SUITE COMPLETE");
  console.log("=".repeat(70) + "\n");
})();
