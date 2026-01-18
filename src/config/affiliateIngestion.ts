import 'server-only';
import { parseProfitshareCsv } from '@/lib/affiliates/profitshare';
import { parseTwoPerformantCsv } from '@/lib/affiliates/twoPerformant';

export type AffiliateIngestProviderId = 'profitshare' | '2performant';

export type AffiliateIngestProvider = {
  id: AffiliateIngestProviderId;
  label: string;           // human-readable name for UI
  description?: string;    // optional help text
};

export const AFFILIATE_INGEST_PROVIDERS: AffiliateIngestProvider[] = [
  {
    id: 'profitshare',
    label: 'Profitshare CSV',
    description: 'Legacy Profitshare affiliate feed format',
  },
  {
    id: '2performant',
    label: '2Performant CSV',
    description: '2Performant affiliate network feed',
  },
  // NOTE: in the future, we can add { id: 'generic', label: 'Generic CSV', ... } without touching UI or route names
];

export const AFFILIATE_INGEST_PARSERS: Record<
  AffiliateIngestProviderId,
  (content: string) => any
> = {
  profitshare: parseProfitshareCsv,
  '2performant': parseTwoPerformantCsv,
};

export function isValidProvider(provider: string): provider is AffiliateIngestProviderId {
  return Object.keys(AFFILIATE_INGEST_PARSERS).includes(provider);
}
