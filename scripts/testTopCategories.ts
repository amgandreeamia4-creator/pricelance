import { setTimeout as delay } from "node:timers/promises";
import * as http from "node:http";

const BASE_URL = "http://localhost:3000";

const CATEGORY_SLUGS = [
  "phones",
  "phone-cases-protection",
  "laptops",
  "monitors",
  "tv-display",
  "headphones-audio",
  "keyboards-mice",
  "home-garden",
  "personal-care",
  "small-appliances",
  "wellness-supplements",
  "gifts-lifestyle",
  "books-media",
  "toys-games",
  "kitchen",
  "tablets",
  "smartwatches",
] as const;

type TestResult =
  | { slug: string; kind: "ok"; products: number; total: number }
  | { slug: string; kind: "http-error"; status: number; statusText: string }
  | { slug: string; kind: "network-error"; message: string };

async function testCategory(slug: string): Promise<TestResult> {
  const url = `${BASE_URL}/api/products?categorySlug=${encodeURIComponent(
    slug,
  )}&limit=2`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        return {
          slug,
          kind: "http-error",
          status: res.status,
          statusText: res.statusText,
        };
      }

      const json: any = await res.json();
      const products = Array.isArray(json.products) ? json.products.length : 0;
      const total = typeof json.total === "number" ? json.total : NaN;

      return { slug, kind: "ok", products, total };
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: any) {
    return {
      slug,
      kind: "network-error",
      message: err?.message ?? String(err),
    };
  }
}

async function main() {
  console.log("Testing category endpoints against", BASE_URL);
  console.log("--------------------------------------------------");

  for (const slug of CATEGORY_SLUGS) {
    const result = await testCategory(slug);

    switch (result.kind) {
      case "ok":
        console.log(
          `${slug.padEnd(22)} -> OK  products=${String(
            result.products,
          ).padStart(3)} total=${result.total}`,
        );
        break;
      case "http-error":
        console.log(
          `${slug.padEnd(22)} -> HTTP ${result.status} ${result.statusText}`,
        );
        break;
      case "network-error":
        console.log(
          `${slug.padEnd(22)} -> NETWORK ERROR: ${result.message}`,
        );
        break;
    }

    // tiny delay to avoid hammering dev server
    await delay(80);
  }

  console.log("--------------------------------------------------");
  console.log("Test complete.");
}

main().catch((err) => {
  console.error("Fatal error in testTopCategories:", err);
  process.exitCode = 1;
});
