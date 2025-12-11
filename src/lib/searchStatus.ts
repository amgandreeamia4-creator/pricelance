// src/lib/searchStatus.ts
// Shared helpers for summarizing search/provider status for UX.

import type { EnrichmentResult } from "./searchEnrichment";

export type SearchStatus = "ok" | "ok-db-only" | "no-results" | "error";

export type ProviderSimpleState = "ok" | "error" | "disabled";

export type ProviderStatus = {
  realstore?: ProviderSimpleState;
  catalog?: ProviderSimpleState;
};

export function computeSearchStatus(
  totalCount: number,
  enrichmentMeta: EnrichmentResult | null,
): { status: SearchStatus; providerStatus: ProviderStatus } {
  const dataStatus = enrichmentMeta?.dataStatus ?? "ok";
  const hadTimeout = Boolean(enrichmentMeta?.hadTimeout);
  const hadError = Boolean(enrichmentMeta?.hadError);

  const providerFailed =
    dataStatus === "provider_timeout" ||
    dataStatus === "provider_error" ||
    hadTimeout ||
    hadError;

  let status: SearchStatus;

  if (totalCount > 0) {
    status = providerFailed ? "ok-db-only" : "ok";
  } else {
    status = "no-results";
  }

  const providerStatus: ProviderStatus = {
    catalog: "ok",
    realstore: providerFailed ? "error" : "ok",
  };

  return { status, providerStatus };
}
