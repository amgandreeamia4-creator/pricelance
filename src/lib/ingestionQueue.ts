import { Queue, QueueEvents } from "bullmq";

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const redisUrl = process.env.REDIS_URL?.trim();
const connection = redisUrl
  ? { connection: { url: redisUrl } }
  : {
      connection: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    };

const queueOptions = {
  ...connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400,
    },
    removeOnFail: {
      age: 604800,
    },
  },
};

function createNoopQueue<T extends object>(name: string): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      if (prop === "add") {
        return async () => {
          throw new Error(`BullMQ queue ${name} is unavailable because Redis is not configured.`);
        };
      }
      if (prop === "getJobCounts") {
        return async () => ({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 });
      }
      if (prop === "getRepeatableJobs") {
        return async () => [];
      }
      if (prop === "getJobs") {
        return async () => [];
      }
      if (prop === "close") {
        return async () => undefined;
      }
      if (prop === "waitUntilReady") {
        return async () => undefined;
      }
      if (prop === "removeListener" || prop === "on" || prop === "off") {
        return () => undefined;
      }
      return undefined;
    },
  });
}

export const ingestionQueue = isBuildPhase
  ? createNoopQueue<Queue>("ingestionQueue")
  : new Queue("ingestionQueue", queueOptions);
export const ingestionQueueEvents = isBuildPhase
  ? createNoopQueue<QueueEvents>("ingestionQueueEvents")
  : new QueueEvents("ingestionQueue", connection);

export type AffiliateImportJobData = {
  provider: "profitshare" | "fake" | "banggood";
  csv?: string;
  listings?: Array<Record<string, any>>;
  categoryId?: string;
  page?: number;
  pageSize?: number;
  merchantFeedId?: string;
  merchantId?: string;
  affiliateProgram?: string;
  network?: string;
};

export type UrlImportJobData = {
  csv: string;
  validateUrls: boolean;
  merchantFeedId?: string;
  merchantId?: string;
};

export type IngestionJobType = "affiliate_import" | "url_import";

export type IngestionJobResult = {
  summary: unknown;
  totalRows?: number;
  skippedRows?: number;
  skippedMissingFields?: number;
  capped?: boolean;
  message?: string | null;
};
