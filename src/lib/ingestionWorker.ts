import { Job, Worker } from "bullmq";
import { processCsvImport } from "@/lib/ingestion/csvProcessor";
import { profitshareAdapter, fakeAffiliateAdapter, googleSheetAdapter, fetchBanggoodListings } from "@/lib/ingestion/adapters";
import { importNormalizedListings } from "@/lib/ingestion/importService";
import type { CsvImportJobData, AffiliateImportJobData, UrlImportJobData } from "@/lib/ingestionQueue";

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

const redisUrl = process.env.REDIS_URL?.trim();
const connection = redisUrl
  ? { url: redisUrl }
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
    };

type JobPayload = CsvImportJobData | AffiliateImportJobData | UrlImportJobData;

async function processAffiliateImport(data: AffiliateImportJobData): Promise<WorkerResult> {
  const { provider, csv, listings, merchantFeedId, merchantId, affiliateProgram, network, categoryId, page, pageSize } = data;

  if (provider === "banggood") {
    const rawListings = listings ?? (await fetchBanggoodListings({ categoryId, page, pageSize }));
    const summary = await importNormalizedListings(rawListings as any[], {
      source: "affiliate",
      affiliateProvider: "banggood",
      affiliateProgram: affiliateProgram ?? "banggood",
      merchantId,
      merchantFeedId,
    });
    return { summary, message: null };
  }

  if (provider === "profitshare") {
    if (!csv) throw new Error("Missing CSV payload for Profitshare affiliate import");
    const result = profitshareAdapter.normalizeWithMeta(csv);
    if (result.headerError) throw new Error(result.headerError);
    const summary = await importNormalizedListings(result.normalized.slice(0, MAX_IMPORT_ROWS), {
      source: "affiliate",
      defaultCountryCode: "RO",
      affiliateProvider: "profitshare",
      affiliateProgram: affiliateProgram ?? "profitshare_ro",
      network: network ?? "PROFITSHARE",
      startRowNumber: 2,
      merchantId,
      merchantFeedId,
    });
    return buildCsvResult(summary, result.totalRows, result.skippedRows, result.skippedMissingFields ?? 0, result.normalized.length > MAX_IMPORT_ROWS, null);
  }

  if (provider === "fake") {
    if (!csv) throw new Error("Missing CSV payload for fake affiliate import");
    const result = fakeAffiliateAdapter.normalizeWithMeta(csv);
    if (result.headerError) throw new Error(result.headerError);
    const summary = await importNormalizedListings(result.normalized.slice(0, MAX_IMPORT_ROWS), {
      source: "affiliate",
      defaultCountryCode: "RO",
      affiliateProvider: "fake",
      affiliateProgram: affiliateProgram ?? "fake_test_program",
      startRowNumber: 2,
      merchantId,
      merchantFeedId,
    });
    return buildCsvResult(summary, result.totalRows, result.skippedRows, result.skippedMissingFields ?? 0, result.normalized.length > MAX_IMPORT_ROWS, null);
  }

  throw new Error(`Unsupported affiliate provider: ${provider}`);
}

async function processUrlImport(data: UrlImportJobData): Promise<WorkerResult> {
  const { csv, validateUrls, merchantFeedId, merchantId } = data;
  const result = googleSheetAdapter.normalize(csv);
  const summary = await importNormalizedListings(result, {
    source: "sheet",
    defaultCountryCode: "RO",
    startRowNumber: 2,
    validateUrls,
    merchantId,
    merchantFeedId,
  });

  return { summary, message: null };
}

const worker = new Worker<JobPayload, WorkerResult>(
  "ingestionQueue",
  async (job: Job<JobPayload, WorkerResult>) => {
      switch (job.name) {
        case "csv_import":
          return processCsvImport(job.data as CsvImportJobData);
        case "affiliate_import":
          return processAffiliateImport(job.data as AffiliateImportJobData);
        case "url_import":
          return processUrlImport(job.data as UrlImportJobData);
        default:
          throw new Error(`Unknown ingestion job type: ${job.name}`);
      }
  },
  {
    connection,
    concurrency: 2,
    lockDuration: 600000,
    autorun: true,
  },
);

worker.on("completed", (job: Job<JobPayload, WorkerResult>) => {
  console.log(`[ingestionWorker] Job completed: ${job.id} (${job.name})`);
});

worker.on(
  "failed",
  (job: Job<JobPayload, WorkerResult> | undefined, err: Error | string) => {
    console.error(`[ingestionWorker] Job failed: ${job?.id} (${job?.name})`, err);
  },
);

process.on("SIGINT", async () => {
  console.log("[ingestionWorker] SIGINT received, shutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[ingestionWorker] SIGTERM received, shutting down worker...");
  await worker.close();
  process.exit(0);
});

console.log("[ingestionWorker] Worker started and listening for ingestion jobs.");
