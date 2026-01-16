import 'server-only';
import { parseProfitshareCsv } from '@/lib/affiliates/profitshare';
import { parseTwoPerformantCsv } from '@/lib/affiliates/twoPerformant';

export type AffiliateIngestProviderId = 'profitshare' | '2performant';

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
