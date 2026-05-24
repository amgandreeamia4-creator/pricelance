import { profitshareAdapter } from '@/lib/affiliates/profitshareAdapter';
import { twoPerformantAdapter } from '@/lib/affiliates/twoPerformantAdapter';
import { importNormalizedListings } from '@/lib/importService';
import type { ImportOptions } from '@/lib/importService';

export async function runImportPipeline(raw: string, provider: string, options: ImportOptions, dbClient?: any) {
  // Choose adapter
  let normalized: any[] = [];
  if (provider === 'profitshare') {
    normalized = profitshareAdapter.normalize(raw);
  } else if (provider === '2performant' || provider === '2performant') {
    normalized = twoPerformantAdapter.normalize(raw);
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  // Call the shared importer; allow injecting a mock DB client
  const summary = await importNormalizedListings(normalized, options, dbClient);
  return { normalized, summary };
}
