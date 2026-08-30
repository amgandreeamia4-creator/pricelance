import { ingestionQueue } from "@/lib/ingestionQueue";
import { prisma } from "@/lib/db";

/**
 * Scheduler configuration is driven by environment variables.
 *
 * Examples:
 *   SCHEDULED_INGESTION_MODE=hourly
 *   SCHEDULED_CSV_FEEDS=[{"id":"profitshare","name":"Profitshare","url":"https://...","provider":"profitshare","schedule":"hourly"}]
 *   SCHEDULED_URL_FEEDS=[{"id":"master-sheet","name":"Master sheet","url":"https://...","validateUrls":true,"schedule":"daily"}]
 *   SCHEDULED_AFFILIATE_FEEDS=[{"id":"banggood-us","name":"Banggood","provider":"banggood","categoryId":"1011","schedule":"hourly"}]
 *   SCHEDULED_STALE_FEED_THRESHOLD_HOURS=48
 */
export type ScheduledIngestionMode = "manual" | "hourly" | "daily";
export type ScheduledIngestionFrequency = "hourly" | "daily";

const DEFAULT_FEED_SCHEDULE: ScheduledIngestionFrequency = "daily";
const DEFAULT_STALE_FEED_HOURS = 48;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("[ingestionScheduler] Failed to parse JSON config:", error);
    return fallback;
  }
}

function getScheduleIntervalMs(schedule: ScheduledIngestionFrequency) {
  return schedule === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
}

export function getScheduledIngestionMode(): ScheduledIngestionMode {
  const raw = process.env.SCHEDULED_INGESTION_MODE?.trim().toLowerCase();
  if (raw === "manual" || raw === "hourly" || raw === "daily") {
    return raw;
  }
  return "daily";
}

export type ScheduledCsvFeedConfig = {
  id: string;
  name: string;
  url: string;
  provider: "profitshare" | "2performant";
  schedule?: ScheduledIngestionFrequency;
  merchantId?: string;
  merchantFeedId?: string;
};

export type ScheduledUrlFeedConfig = {
  id: string;
  name: string;
  url: string;
  validateUrls?: boolean;
  schedule?: ScheduledIngestionFrequency;
  merchantId?: string;
  merchantFeedId?: string;
};

export type ScheduledAffiliateFeedConfig = {
  id: string;
  name: string;
  provider: "banggood";
  schedule?: ScheduledIngestionFrequency;
  categoryId: string;
  page?: number;
  pageSize?: number;
  merchantId?: string;
  merchantFeedId?: string;
  affiliateProgram?: string;
  network?: string;
};

type SchedulerEntry = {
  id: string;
  name: string;
  schedule: ScheduledIngestionFrequency;
  jobName: "affiliate_import" | "url_import";
  jobDataFactory: () => Promise<Record<string, unknown>>;
};

async function fetchRemoteText(url: string) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new Error("Scheduled ingestion URL is empty");
  }

  const response = await fetch(trimmedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${trimmedUrl}: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

function normalizeSchedule(value: string | undefined): ScheduledIngestionFrequency {
  if (!value) return DEFAULT_FEED_SCHEDULE;
  const normalized = value.trim().toLowerCase();
  return normalized === "hourly" ? "hourly" : "daily";
}

function buildUrlFeedSchedule(feed: ScheduledUrlFeedConfig): SchedulerEntry {
  return {
    id: `url:${feed.id}`,
    name: `url:${feed.name}`,
    schedule: normalizeSchedule(feed.schedule),
    jobName: "url_import",
    jobDataFactory: async () => {
      const csv = await fetchRemoteText(feed.url);
      return {
        csv,
        validateUrls:
          feed.validateUrls !== undefined
            ? parseBoolean(String(feed.validateUrls), true)
            : true,
        merchantFeedId: feed.merchantFeedId,
        merchantId: feed.merchantId,
      };
    },
  };
}

function buildAffiliateFeedSchedule(feed: ScheduledAffiliateFeedConfig): SchedulerEntry {
  return {
    id: `affiliate:${feed.id}`,
    name: `affiliate:${feed.name}`,
    schedule: normalizeSchedule(feed.schedule),
    jobName: "affiliate_import",
    jobDataFactory: async () => {
      return {
        provider: feed.provider,
        categoryId: feed.categoryId,
        page: feed.page ?? 1,
        pageSize: feed.pageSize ?? 100,
        merchantFeedId: feed.merchantFeedId,
        merchantId: feed.merchantId,
        affiliateProgram: feed.affiliateProgram,
        network: feed.network,
      };
    },
  };
}

function getScheduledUrlFeeds(): ScheduledUrlFeedConfig[] {
  return parseJson<ScheduledUrlFeedConfig[]>(process.env.SCHEDULED_URL_FEEDS, []);
}

function getScheduledAffiliateFeeds(): ScheduledAffiliateFeedConfig[] {
  return parseJson<ScheduledAffiliateFeedConfig[]>(process.env.SCHEDULED_AFFILIATE_FEEDS, []);
}

export async function collectScheduledIngestionJobs(): Promise<SchedulerEntry[]> {
  const entries: SchedulerEntry[] = [];

  const urlFeeds = getScheduledUrlFeeds();
  for (const feed of urlFeeds) {
    if (feed.id && feed.url) {
      entries.push(buildUrlFeedSchedule(feed));
    }
  }

  const affiliateFeeds = getScheduledAffiliateFeeds();
  for (const feed of affiliateFeeds) {
    if (feed.id && feed.provider && feed.categoryId) {
      entries.push(buildAffiliateFeedSchedule(feed));
    }
  }

  return entries;
}

async function scheduleRepeatableJob(entry: SchedulerEntry) {
  const repeatInterval = getScheduleIntervalMs(entry.schedule);
  const jobId = `scheduled:${entry.id}`;
  const jobData = await entry.jobDataFactory();

  await ingestionQueue.add(entry.jobName, jobData, {
    jobId,
    repeat: {
      every: repeatInterval,
      tz: "UTC",
    },
    removeOnComplete: true,
    removeOnFail: true,
  });

  console.info(`[@ingestionScheduler] Registered scheduled job: ${entry.name} (${entry.jobName}, every=${entry.schedule})`);
}

export type StaleFeedRun = {
  merchantId: string;
  storeName: string | null;
  lastRunAt: Date;
  ageHours: number;
  rowsImportedTotal: number;
};

export async function detectStaleMerchantFeedRuns(
  thresholdHours = DEFAULT_STALE_FEED_HOURS,
): Promise<StaleFeedRun[]> {
  const grouped = await prisma.merchantFeedRun.groupBy({
    by: ["merchantId"],
    _max: {
      createdAt: true,
    },
    _sum: {
      rowsImported: true,
    },
  });

  const stale = grouped
    .filter((item) => {
      const lastRunAt = item._max.createdAt;
      return lastRunAt ? Date.now() - lastRunAt.getTime() > thresholdHours * 60 * 60 * 1000 : true;
    })
    .filter((item) => item._max.createdAt !== null);

  if (stale.length === 0) {
    return [];
  }

  const merchantIds = stale.map((item) => item.merchantId);
  const merchants = await prisma.merchant.findMany({
    where: { id: { in: merchantIds } },
    select: { id: true, name: true },
  });

  return stale.map((item) => {
    const merchant = merchants.find((merchant) => merchant.id === item.merchantId);
    const lastRunAt = item._max.createdAt as Date;
    const ageHours = Math.round((Date.now() - lastRunAt.getTime()) / (60 * 60 * 1000));
    return {
      merchantId: item.merchantId,
      storeName: merchant?.name ?? null,
      lastRunAt,
      ageHours,
      rowsImportedTotal: item._sum.rowsImported ?? 0,
    };
  });
}

export async function startIngestionScheduler() {
  const mode = getScheduledIngestionMode();

  if (mode === "manual") {
    console.info("[@ingestionScheduler] Scheduled ingestion mode is manual; no repeatable jobs will be created.");
    return;
  }

  const scheduledJobs = await collectScheduledIngestionJobs();
  if (scheduledJobs.length === 0) {
    console.info("[@ingestionScheduler] No configured scheduled feeds were found. Set SCHEDULED_CSV_FEEDS, SCHEDULED_URL_FEEDS or SCHEDULED_AFFILIATE_FEEDS to enable scheduling.");
    return;
  }

  console.info(`[@ingestionScheduler] Starting scheduler in '${mode}' mode with ${scheduledJobs.length} configured feeds.`);

  for (const entry of scheduledJobs) {
    try {
      await scheduleRepeatableJob(entry);
    } catch (error) {
      console.error(`[@ingestionScheduler] Failed to schedule ${entry.name}:`, error);
    }
  }

  const thresholdHours = Number(process.env.SCHEDULED_STALE_FEED_THRESHOLD_HOURS || DEFAULT_STALE_FEED_HOURS);
  const staleRuns = await detectStaleMerchantFeedRuns(thresholdHours);
  if (staleRuns.length > 0) {
    console.warn(`[@ingestionScheduler] Detected ${staleRuns.length} merchant feeds with no ingestion run in the last ${thresholdHours} hours:`);
    staleRuns.forEach((run) => {
      console.warn(`  merchantId=${run.merchantId}, storeName=${run.storeName ?? "unknown"}, ageHours=${run.ageHours}, rowsImported=${run.rowsImportedTotal}`);
    });
  } else {
    console.info(`[@ingestionScheduler] No stale merchant feed runs found within the last ${thresholdHours} hours.`);
  }
}
