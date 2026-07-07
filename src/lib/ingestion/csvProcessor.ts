import { profitshareAdapter, twoPerformantAdapter } from "@/lib/ingestion/adapters";
import { importNormalizedListings } from "@/lib/ingestion/importService";
import type { CsvImportJobData } from "@/lib/ingestionQueue";

const MAX_IMPORT_ROWS = 300;

type WorkerResult = {
  summary: unknown;
  totalRows?: number;
  skippedRows?: number;
  skippedMissingFields?: number;
  capped?: boolean;
  message?: string | null;
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

export async function processCsvImport(data: CsvImportJobData): Promise<WorkerResult> {
  const { csv, provider: requestedProvider, merchantFeedId, merchantId } = data;

  if (!csv) throw new Error("Missing CSV payload");
  const provider = requestedProvider ?? "2performant";

  const adapter = provider === "profitshare" ? profitshareAdapter : twoPerformantAdapter;
  const result = adapter.normalizeWithMeta(csv);

  if (result.headerError) {
    throw new Error(result.headerError);
  }

  const capped = result.normalized.length > MAX_IMPORT_ROWS;
  const summary = await importNormalizedListings(result.normalized.slice(0, MAX_IMPORT_ROWS), {
    source: "affiliate",
    defaultCountryCode: "RO",
    affiliateProvider: provider,
    affiliateProgram: provider === "profitshare" ? "profitshare_ro" : "2performant_ro",
    network: provider === "profitshare" ? "PROFITSHARE" : "TWOPERFORMANT",
    startRowNumber: 2,
    merchantId,
    merchantFeedId,
  });

  return buildCsvResult(summary, result.totalRows, result.skippedRows, result.skippedMissingFields ?? 0, capped, null);
}

export type { WorkerResult };
