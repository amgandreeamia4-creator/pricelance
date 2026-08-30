import { googleSheetAdapter, profitshareAdapter, twoPerformantAdapter } from "@/lib/ingestion/adapters";
import { importNormalizedListings } from "@/lib/ingestion/importService";

const MAX_IMPORT_ROWS = 300;

type WorkerResult = {
  summary: unknown;
  totalRows?: number;
  skippedRows?: number;
  skippedMissingFields?: number;
  capped?: boolean;
  message?: string | null;
};

/**
 * Input shared by synchronous CSV uploads and optional background callers.
 * This deliberately does not depend on BullMQ job types.
 */
export type CsvImportInput = {
  provider?: "generic" | "profitshare" | "2performant";
  csv: string;
  merchantFeedId?: string;
  merchantId?: string;
};

function buildCsvResult(
  summary: unknown,
  totalRows: number,
  skippedRows: number,
  skippedMissingFields: number,
  capped: boolean,
  message: string | null,
): WorkerResult {
  return { summary, totalRows, skippedRows, skippedMissingFields, capped, message };
}

export async function processCsvImport(data: CsvImportInput): Promise<WorkerResult> {
  const { csv, provider: requestedProvider, merchantFeedId, merchantId } = data;

  if (!csv) throw new Error("Missing CSV payload");
  const provider = requestedProvider ?? "generic";

  const adapter = provider === "generic"
    ? googleSheetAdapter
    : provider === "profitshare"
      ? profitshareAdapter
      : twoPerformantAdapter;
  const result = adapter.normalizeWithMeta(csv);

  if (result.headerError) {
    throw new Error(result.headerError);
  }

  const capped = result.normalized.length > MAX_IMPORT_ROWS;
  const summary = await importNormalizedListings(result.normalized.slice(0, MAX_IMPORT_ROWS), {
    source: provider === "generic" ? "sheet" : "affiliate",
    defaultCountryCode: provider === "generic" ? undefined : "RO",
    affiliateProvider: provider === "generic" ? undefined : provider,
    affiliateProgram: provider === "profitshare" ? "profitshare_ro" : provider === "2performant" ? "2performant_ro" : undefined,
    network: provider === "profitshare" ? "PROFITSHARE" : provider === "2performant" ? "TWOPERFORMANT" : undefined,
    startRowNumber: 2,
    merchantId,
    merchantFeedId,
  });

  return buildCsvResult(summary, result.totalRows, result.skippedRows, result.skippedMissingFields ?? 0, capped, null);
}

export type { WorkerResult };
