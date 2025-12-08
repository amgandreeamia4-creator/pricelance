// src/lib/searchEnrichment.ts
import { getEnabledProviders } from "@/lib/providers";
import { ingestProducts } from "@/lib/ingestService";
import type { ProviderErrorType } from "@/lib/providers/types";

/**
 * Minimum number of results we want to have in the DB for a query
 * before we decide not to call external providers.
 */
export const MIN_RESULTS_THRESHOLD = 10;

/**
 * Backwards-compat alias for older imports.
 * Some code (e.g. /api/products/search/route.ts) imports
 * MIN_RESULTS_BEFORE_ENRICH from this module. Keep that working.
 */
export const MIN_RESULTS_BEFORE_ENRICH = MIN_RESULTS_THRESHOLD;

/**
 * Safety cap: how many payloads we ingest from a single provider
 * in response to a single query.
 */
export const MAX_PROVIDER_RESULTS_PER_CALL = 20;

/**
 * Debug info about a single provider call during enrichment.
 */
export interface ProviderCallDebug {
  name: string;
  payloadsReturned: number;
  ingestedCount: number;
  error?: string;
  errorType?: ProviderErrorType;
}

/**
 * Data status indicating the overall outcome of the enrichment.
 */
export type DataStatus = 
  | "ok"                    // All providers succeeded (even if 0 results)
  | "partial"               // Some providers succeeded, some failed
  | "provider_timeout"      // At least one provider timed out
  | "provider_error"        // At least one provider had an error (non-timeout)
  | "no_providers";         // No providers were configured/enabled

/**
 * Result returned by enrichSearchResultsIfNeeded for debug/meta purposes.
 */
export interface EnrichmentResult {
  totalBefore: number;
  totalAfter: number;
  providerCalls: ProviderCallDebug[];
  /** Overall status of the enrichment attempt */
  dataStatus: DataStatus;
  /** True if any provider had a timeout */
  hadTimeout: boolean;
  /** True if any provider had any error (including timeout) */
  hadError: boolean;
}

/**
 * Optionally enrich search results by calling enabled providers
 * when the current result count is too low.
 *
 * - `query`: user search text
 * - `currentResultCount`: how many results we already have in the DB
 *
 * Returns enrichment meta for debug purposes.
 * This function logs errors but never throws, so it cannot break the main /search endpoint.
 */
export async function enrichSearchResultsIfNeeded(
  query: string,
  currentResultCount: number
): Promise<EnrichmentResult> {
  const normalized = query.trim();

  // Default result when we skip enrichment
  const noOpResult: EnrichmentResult = {
    totalBefore: currentResultCount,
    totalAfter: currentResultCount,
    providerCalls: [],
    dataStatus: "ok",
    hadTimeout: false,
    hadError: false,
  };

  if (!normalized || normalized.length < 2) {
    // Too short / empty query – don't enrich.
    console.log("[searchEnrichment] Query too short, skipping enrichment", { query: normalized });
    return noOpResult;
  }

  if (currentResultCount >= MIN_RESULTS_THRESHOLD) {
    // We already have enough results, no need to call providers.
    console.log("[searchEnrichment] Enough results already, skipping enrichment", {
      query: normalized,
      currentResultCount,
      threshold: MIN_RESULTS_THRESHOLD,
    });
    return noOpResult;
  }

  // Get enabled providers at runtime (not from static import)
  const enabledProviders = getEnabledProviders();

  if (!enabledProviders || enabledProviders.length === 0) {
    // No providers configured – nothing to do.
    console.log("[searchEnrichment] No providers configured, skipping enrichment");
    return noOpResult;
  }

  const debugProviderCalls: ProviderCallDebug[] = [];
  let totalIngested = 0;

  // Always log enrichment start with provider list for transparency
  console.log(
    "[searchEnrichment] Running enrichment for query:",
    normalized,
    "| initialCount:",
    currentResultCount,
    "| providers:",
    enabledProviders.map((p) => p.name)
  );

  try {
    for (const provider of enabledProviders) {
      console.log("[searchEnrichment] Calling provider:", provider.name, "| query:", normalized);

      try {
        // Use searchProductsWithStatus if available for better error tracking
        let payloads: Awaited<ReturnType<typeof provider.searchProducts>>;
        let providerError: { type: ProviderErrorType; message: string } | undefined;

        if (provider.searchProductsWithStatus) {
          const result = await provider.searchProductsWithStatus(normalized);
          payloads = result.payloads;
          providerError = result.error;
          
          if (providerError) {
            console.log(`[searchEnrichment] Provider ${provider.name} returned error:`, providerError.type, providerError.message);
          }
        } else {
          // Fallback to legacy method
          payloads = await provider.searchProducts(normalized);
        }

        const payloadsCount = payloads?.length ?? 0;
        console.log("[searchEnrichment] Provider", provider.name, "returned", payloadsCount, "payloads");

        if (providerError) {
          // Provider had an error - record it but don't throw
          debugProviderCalls.push({
            name: provider.name,
            payloadsReturned: 0,
            ingestedCount: 0,
            error: providerError.message,
            errorType: providerError.type,
          });
          continue;
        }

        if (!payloads || payloads.length === 0) {
          console.log("[searchEnrichment] Provider", provider.name, "returned no payloads (empty result)");
          debugProviderCalls.push({
            name: provider.name,
            payloadsReturned: 0,
            ingestedCount: 0,
          });
          continue;
        }

        // Each payload is an IngestPayload (array of products or { products: [...] })
        // We need to ingest each payload separately and sum up the results
        let providerIngestedCount = 0;

        for (let i = 0; i < payloads.length; i++) {
          const payload = payloads[i];
          try {
            const ingestResult = await ingestProducts(payload);
            const count = ingestResult?.count ?? 0;
            providerIngestedCount += count;

            console.log("[searchEnrichment] Ingested payload", i + 1, "from", provider.name, "| count:", count, "| productIds:", ingestResult?.productIds?.slice(0, 3));
          } catch (ingestErr) {
            console.error("[searchEnrichment] Error ingesting payload", i + 1, "from", provider.name, ingestErr);
          }
        }

        console.log("[searchEnrichment] Provider", provider.name, "total ingested:", providerIngestedCount, "products");

        debugProviderCalls.push({
          name: provider.name,
          payloadsReturned: payloadsCount,
          ingestedCount: providerIngestedCount,
        });

        totalIngested += providerIngestedCount;
      } catch (err) {
        // Catch provider errors but do NOT throw – continue with other providers
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[searchEnrichment] Error calling provider", provider.name, ":", errorMessage, err);
        debugProviderCalls.push({
          name: provider.name,
          payloadsReturned: 0,
          ingestedCount: 0,
          error: errorMessage,
        });
        // Continue with other providers.
      }
    }
  } catch (err) {
    // Global safety net – never throw out of this function.
    console.error(
      `[searchEnrichment] Unexpected error while enriching results for "${normalized}":`,
      err
    );
  }

  // Compute overall data status
  const hadTimeout = debugProviderCalls.some((p) => p.errorType === "timeout");
  const hadError = debugProviderCalls.some((p) => !!p.error);
  const allFailed = debugProviderCalls.length > 0 && debugProviderCalls.every((p) => !!p.error);
  const someFailed = debugProviderCalls.some((p) => !!p.error) && !allFailed;

  let dataStatus: DataStatus = "ok";
  if (enabledProviders.length === 0) {
    dataStatus = "no_providers";
  } else if (hadTimeout && allFailed) {
    dataStatus = "provider_timeout";
  } else if (allFailed) {
    dataStatus = "provider_error";
  } else if (someFailed) {
    dataStatus = "partial";
  }

  const result: EnrichmentResult = {
    totalBefore: currentResultCount,
    totalAfter: currentResultCount + totalIngested,
    providerCalls: debugProviderCalls,
    dataStatus,
    hadTimeout,
    hadError,
  };

  // Always log enrichment completion for transparency
  console.log("[searchEnrichment] Enrichment complete", {
    query: normalized,
    totalBefore: result.totalBefore,
    totalAfter: result.totalAfter,
    providerCalls: result.providerCalls,
  });

  return result;
}