import 'server-only';
import { googleSheetAdapter } from '@/lib/affiliates/googleSheet';
import { parseProfitshareCsv } from '@/lib/affiliates/profitshare';
import { parseTwoPerformantCsv } from '@/lib/affiliates/twoPerformant';

export type AffiliateIngestProviderId = 'generic' | 'profitshare' | '2performant';

export type AffiliateIngestProvider = {
  id: AffiliateIngestProviderId;
  label: string;           // human-readable name for UI
  description?: string;    // optional help text
};

export const AFFILIATE_INGEST_PROVIDERS: AffiliateIngestProvider[] = [
  {
    id: 'generic',
    label: 'Generic CSV (Recommended)',
    description: 'Import any standard merchant, supplier or affiliate CSV feed',
  },
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
];

export const AFFILIATE_INGEST_PARSERS: Record<
  AffiliateIngestProviderId,
  (content: string) => any
> = {
  generic: (content) => googleSheetAdapter.normalize(content),
  profitshare: parseProfitshareCsv,
  '2performant': parseTwoPerformantCsv,
};

export function isValidProvider(provider: string): provider is AffiliateIngestProviderId {
  return Object.keys(AFFILIATE_INGEST_PARSERS).includes(provider);
}
