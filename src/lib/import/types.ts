export type SkipReason =
  | "missing_name"
  | "missing_affiliate_url"
  | "missing_any_url"
  | "invalid_price"
  | "invalid_currency"
  | "invalid_row"
  | "deduped_duplicate"
  | "other";

export type ImportRunStats = {
  provider: string;
  startedAt: string;
  totalRowsSeen: number;
  totalRowsParsed: number;
  totalRowsNormalized: number;
  totalRowsSkipped: number;
  skippedByReason: Record<SkipReason, number>;
  productsUpserted: number;
  listingsUpserted: number;
  batches: number;
  errors: number;
  sampleSkipExamples: Array<{
    reason: SkipReason;
    rowIndex: number;
    details?: string;
  }>;
};

export function createEmptyImportRunStats(provider: string): ImportRunStats {
  return {
    provider,
    startedAt: new Date().toISOString(),
    totalRowsSeen: 0,
    totalRowsParsed: 0,
    totalRowsNormalized: 0,
    totalRowsSkipped: 0,
    skippedByReason: {
      missing_name: 0,
      missing_affiliate_url: 0,
      missing_any_url: 0,
      invalid_price: 0,
      invalid_currency: 0,
      invalid_row: 0,
      deduped_duplicate: 0,
      other: 0,
    },
    productsUpserted: 0,
    listingsUpserted: 0,
    batches: 0,
    errors: 0,
    sampleSkipExamples: [],
  };
}

export function recordSkip(
  stats: ImportRunStats,
  reason: SkipReason,
  rowIndex: number,
  details?: string
) {
  stats.totalRowsSkipped += 1;
  stats.skippedByReason[reason] += 1;
  if (stats.sampleSkipExamples.length < 20) {
    stats.sampleSkipExamples.push({ reason, rowIndex, details });
  }
}
