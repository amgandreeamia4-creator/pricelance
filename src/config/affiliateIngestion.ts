// src/config/affiliateIngestion.ts
// =============================================================================
// AFFILIATE INGESTION PROVIDER REGISTRY
// =============================================================================
//
// Central configuration for affiliate CSV ingestion providers.
// This provides a clean way to add new affiliate networks without
// modifying UI components or API routes.
//
// Adding a new provider:
// 1. Add entry to AFFILIATE_INGEST_PROVIDERS
// 2. Add parser function to AFFILIATE_INGEST_PARSERS
// 3. Import and use the parser function
// =============================================================================

import { parseProfitshareCsv } from '@/lib/affiliates/profitshare';
import { parseTwoPerformantCsv } from '@/lib/affiliates/twoPerformant';

export type AffiliateIngestProviderId = 'profitshare' | '2performant'; // later: | 'generic' | 'manual' etc.

export type AffiliateIngestProvider = {
  id: AffiliateIngestProviderId;
  label: string;           // human-readable name for UI
  description?: string;    // optional help text
};

export const AFFILIATE_INGEST_PROVIDERS: AffiliateIngestProvider[] = [
  {
    id: 'profitshare',
    label: 'Profitshare CSV',
    description: 'Standard Profitshare product feed.',
  },
  {
    id: '2performant',
    label: '2Performant CSV',
    description: '2Performant affiliate product feed.',
  },
  // NOTE: in the future, we can add { id: 'generic', label: 'Generic CSV', ... } without touching UI or route names
];

// Parser registry – used only server-side
export const AFFILIATE_INGEST_PARSERS: Record<
  AffiliateIngestProviderId,
  (content: string) => any
> = {
  profitshare: parseProfitshareCsv,
  '2performant': parseTwoPerformantCsv,
};

// Helper function to validate provider ID
export function isValidProvider(provider: string): provider is AffiliateIngestProviderId {
  return Object.keys(AFFILIATE_INGEST_PARSERS).includes(provider);
}
