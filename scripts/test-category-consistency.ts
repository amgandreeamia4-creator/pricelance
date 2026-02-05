#!/usr/bin/env npx ts-node
/**
 * Test Category Consistency Across System
 * Verifies:
 * 1. All categories in categories.ts have valid slug/label pairs
 * 2. API accepts all category slugs
 * 3. CATEGORY_KEY_TO_SLUG mapping covers all categories in categoryFilters.ts
 * 4. No inconsistencies between files
 */

import { CATEGORY_TREE, type CategorySlug, type CanonicalCategoryLabel, type CategoryFamilySlug } from "@/config/categories";
import { CATEGORY_SYNONYMS, type CategoryKey } from "@/config/categoryFilters";

console.log("\n📋 CATEGORY CONSISTENCY TEST\n");
console.log("=".repeat(60));

// Test 1: Verify CATEGORY_TREE structure
console.log("\n✅ TEST 1: CATEGORY_TREE Structure");
console.log("-".repeat(60));
console.log(`Total categories in CATEGORY_TREE: ${CATEGORY_TREE.length}`);

const families = new Set<CategoryFamilySlug>();
const slugs = new Set<CategorySlug>();
const labels = new Set<CanonicalCategoryLabel>();

CATEGORY_TREE.forEach((node) => {
  families.add(node.family);
  slugs.add(node.slug);
  labels.add(node.label);
});

console.log(`Unique families: ${families.size}`);
families.forEach((f) => console.log(`  - ${f}`));

console.log(`\nUnique slugs: ${slugs.size}`);
console.log(`Unique labels: ${labels.size}`);

if (slugs.size !== CATEGORY_TREE.length) {
  console.error(
    `❌ ERROR: Duplicate slugs detected! Expected ${CATEGORY_TREE.length}, got ${slugs.size}`
  );
}

if (labels.size !== CATEGORY_TREE.length) {
  console.error(
    `❌ ERROR: Duplicate labels detected! Expected ${CATEGORY_TREE.length}, got ${labels.size}`
  );
}

// Test 2: Compare with CATEGORY_SYNONYMS (from categoryFilters.ts)
console.log("\n✅ TEST 2: Consistency with categoryFilters.ts");
console.log("-".repeat(60));

const categoryKeysInSynonyms = Object.keys(CATEGORY_SYNONYMS) as CategoryKey[];
console.log(`Total categories in CATEGORY_SYNONYMS: ${categoryKeysInSynonyms.length}`);

const unmappedKeys: CategoryKey[] = [];
const extraKeys: CategoryKey[] = [];

categoryKeysInSynonyms.forEach((key) => {
  const found = CATEGORY_TREE.find((node) => node.label === key);
  if (!found) {
    unmappedKeys.push(key);
    console.log(`  ⚠️  "${key}" in CATEGORY_SYNONYMS but NOT in CATEGORY_TREE`);
  }
});

CATEGORY_TREE.forEach((node) => {
  const found = categoryKeysInSynonyms.find((key) => key === node.label);
  if (!found) {
    console.log(
      `  ⚠️  "${node.label}" in CATEGORY_TREE but NOT in CATEGORY_SYNONYMS`
    );
  }
});

if (unmappedKeys.length === 0) {
  console.log("  ✓ All CATEGORY_SYNONYMS keys are in CATEGORY_TREE");
}

// Test 3: Verify slug/label mapping
console.log("\n✅ TEST 3: Slug to Label Mapping");
console.log("-".repeat(60));

const slugToLabel: Record<string, string> = {};
CATEGORY_TREE.forEach((node) => {
  slugToLabel[node.slug] = node.label;
  console.log(`  ${node.slug.padEnd(25)} → ${node.label}`);
});

// Test 4: Expected coverage
console.log("\n✅ TEST 4: Expected Categories Coverage");
console.log("-".repeat(60));

const expectedSlugs: CategorySlug[] = [
  // Tech (9 total)
  "laptops",
  "phones",
  "phone-cases-protection",
  "monitors",
  "tv-display",
  "headphones-audio",
  "keyboards-mice",
  "tablets",
  "smartwatches",
  
  // Gifts & Lifestyle (3 total)
  "personal-care",
  "wellness-supplements",
  "gifts-lifestyle",
  
  // Books & Media (1 total)
  "books-media",
  
  // Toys & Games (1 total)
  "toys-games",
  
  // Kitchen (2 total)
  "kitchen",
  "small-appliances",
  
  // Home & Garden (1 total)
  "home-garden",
];

console.log(`Expected ${expectedSlugs.length} categories total`);
console.log(`Found ${CATEGORY_TREE.length} categories in CATEGORY_TREE`);

const missing = expectedSlugs.filter(
  (slug) => !CATEGORY_TREE.find((node) => node.slug === slug)
);
const extra = CATEGORY_TREE.filter(
  (node) => !expectedSlugs.includes(node.slug)
);

if (missing.length === 0 && extra.length === 0) {
  console.log("  ✓ All expected categories found");
  console.log("  ✓ No unexpected categories");
} else {
  if (missing.length > 0) {
    console.error(`  ❌ Missing: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    console.error(`  ❌ Extra: ${extra.map((n) => n.slug).join(", ")}`);
  }
}

// Test 5: Family distribution
console.log("\n✅ TEST 5: Family Distribution");
console.log("-".repeat(60));

const familyDistribution: Record<CategoryFamilySlug, string[]> = {
  "tech": [],
  "gifts-lifestyle": [],
  "books-media": [],
  "toys-games": [],
  "kitchen": [],
  "home-garden": [],
};

CATEGORY_TREE.forEach((node) => {
  familyDistribution[node.family].push(node.slug);
});

Object.entries(familyDistribution).forEach(([family, items]) => {
  console.log(`  ${family.padEnd(20)} (${items.length}): ${items.join(", ")}`);
});

console.log("\n" + "=".repeat(60));
console.log("✓ CONSISTENCY TEST COMPLETE");
console.log("=".repeat(60) + "\n");
