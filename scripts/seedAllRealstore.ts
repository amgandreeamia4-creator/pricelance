#!/usr/bin/env tsx
/**
 * scripts/seedAllRealstore.ts
 *
 * CLI script to seed the database with products from multiple categories.
 * Runs realstore ingestion for a predefined list of queries.
 *
 * Run with: npm run dev:seed-realstore
 */

import { runRealstoreIngest, disconnectPrisma, RealstoreIngestResult } from "./runRealstore";

/**
 * List of seed queries to populate the database with diverse products.
 */
const SEED_QUERIES = [
  "laptop",
  "iphone",
  "smartphone",
  "wireless headphones",
  "monitor",
  "coffee",
  "coffee beans",
  "perfume",
  "skincare",
  "groceries",
];

interface SeedSummary {
  query: string;
  success: boolean;
  fetchedItems: number;
  ingestedProducts: number;
  ingestedListings: number;
  error?: string;
}

async function main() {
  console.log("=".repeat(60));
  console.log("[seedAllRealstore] Starting seed for", SEED_QUERIES.length, "queries");
  console.log("=".repeat(60));
  console.log("Queries:", SEED_QUERIES.join(", "));
  console.log("");

  const summaries: SeedSummary[] = [];
  let totalProducts = 0;
  let totalListings = 0;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < SEED_QUERIES.length; i++) {
    const query = SEED_QUERIES[i];
    console.log("");
    console.log("-".repeat(60));
    console.log(`[seedAllRealstore] (${i + 1}/${SEED_QUERIES.length}) Running realstore ingest for "${query}"...`);
    console.log("-".repeat(60));

    try {
      const result: RealstoreIngestResult = await runRealstoreIngest(query);

      summaries.push({
        query,
        success: true,
        fetchedItems: result.fetchedItems,
        ingestedProducts: result.ingestedProducts,
        ingestedListings: result.ingestedListings,
      });

      totalProducts += result.ingestedProducts;
      totalListings += result.ingestedListings;
      successCount++;

      console.log(`[seedAllRealstore] ✔ Done for "${query}" - ${result.ingestedProducts} products, ${result.ingestedListings} listings`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      summaries.push({
        query,
        success: false,
        fetchedItems: 0,
        ingestedProducts: 0,
        ingestedListings: 0,
        error: errorMessage,
      });

      failCount++;

      console.error(`[seedAllRealstore] ✖ Failed for "${query}":`, errorMessage);
    }
  }

  // Final summary
  console.log("");
  console.log("=".repeat(60));
  console.log("[seedAllRealstore] SEED COMPLETE");
  console.log("=".repeat(60));
  console.log("");
  console.log("Summary:");
  console.log(`  Total queries:     ${SEED_QUERIES.length}`);
  console.log(`  Successful:        ${successCount}`);
  console.log(`  Failed:            ${failCount}`);
  console.log(`  Total products:    ${totalProducts}`);
  console.log(`  Total listings:    ${totalListings}`);
  console.log("");

  // Per-query breakdown
  console.log("Per-query breakdown:");
  for (const s of summaries) {
    const status = s.success ? "✔" : "✖";
    const details = s.success
      ? `${s.ingestedProducts} products, ${s.ingestedListings} listings`
      : `Error: ${s.error}`;
    console.log(`  ${status} "${s.query}": ${details}`);
  }

  console.log("");

  // Disconnect Prisma
  await disconnectPrisma();

  // Exit with error code if any failed
  if (failCount > 0) {
    console.log(`[seedAllRealstore] Exiting with code 1 due to ${failCount} failures.`);
    process.exit(1);
  }

  console.log("[seedAllRealstore] All done!");
}

main().catch((error) => {
  console.error("[seedAllRealstore] Unhandled error:", error);
  process.exit(1);
});
