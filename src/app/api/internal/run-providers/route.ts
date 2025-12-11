// src/app/api/internal/run-providers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkInternalAuth } from "@/lib/internalAuth";
import { realStoreProvider } from "@/lib/providers/realStoreProvider";
import { ingestProducts } from "@/lib/ingestService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProviderResult = {
  ok: boolean;
  ingested?: number;
  productIds?: string[];
  error?: string;
};

/**
 * GET /api/internal/run-providers
 *
 * Run product providers to fetch and ingest data.
 * Query params:
 *   - providers: comma-separated list (default: "realstore")
 *   - query: search query to use (default: "laptop")
 *
 * Example: /api/internal/run-providers?providers=realstore&query=smartphone
 */
export async function GET(req: NextRequest) {
  const authError = checkInternalAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const providersParam = searchParams.get("providers") ?? "realstore";
  const query = searchParams.get("query") ?? "laptop";

  const requestedProviders = providersParam.split(",").map((p) => p.trim().toLowerCase());

  console.log("[run-providers] Starting with providers:", requestedProviders, "query:", query);

  const results: Record<string, ProviderResult> = {};
  let totalIngested = 0;
  let totalListings = 0;
  const allProductIds: string[] = [];

  for (const providerName of requestedProviders) {
    if (providerName === "realstore") {
      try {
        console.log("[run-providers] Calling realstore provider with query:", query);
        
        // realStoreProvider always has searchProductsWithStatus defined
        if (!realStoreProvider.searchProductsWithStatus) {
          throw new Error("realStoreProvider.searchProductsWithStatus is not defined");
        }
        const searchResult = await realStoreProvider.searchProductsWithStatus(query);

        if (searchResult.error) {
          console.log("[run-providers] realstore returned error:", searchResult.error);
          results[providerName] = {
            ok: false,
            ingested: 0,
            productIds: [],
            error: searchResult.error.message,
          };
          continue;
        }

        // Ingest the payloads
        let providerIngested = 0;
        let providerListings = 0;
        const providerProductIds: string[] = [];

        for (const payload of searchResult.payloads) {
          const ingestResult = await ingestProducts(payload);
          providerIngested += ingestResult.count;
          providerProductIds.push(...ingestResult.productIds);

          // Count listings from payload
          const products = Array.isArray(payload) ? payload : payload.products ?? [];
          for (const p of products) {
            providerListings += p.listings?.length ?? 0;
          }
        }

        console.log("[run-providers] realstore ingested:", providerIngested, "products,", providerListings, "listings");

        results[providerName] = {
          ok: true,
          ingested: providerIngested,
          productIds: providerProductIds,
        };

        totalIngested += providerIngested;
        totalListings += providerListings;
        allProductIds.push(...providerProductIds);
      } catch (error) {
        console.error("[run-providers] realstore error:", error);
        results[providerName] = {
          ok: false,
          ingested: 0,
          productIds: [],
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } else {
      // Unknown provider
      results[providerName] = {
        ok: false,
        ingested: 0,
        productIds: [],
        error: `Unknown provider: ${providerName}. Supported: realstore`,
      };
    }
  }

  const ok = Object.values(results).some((r) => r.ok);

  return NextResponse.json(
    {
      ok,
      providersRequested: requestedProviders,
      providersRun: Object.keys(results).filter((k) => results[k].ok),
      ingestedProducts: totalIngested,
      ingestedListings: totalListings,
      uniqueProductIds: Array.from(new Set(allProductIds)),
      providers: results,
    },
    { status: ok ? 200 : 500 }
  );
}
