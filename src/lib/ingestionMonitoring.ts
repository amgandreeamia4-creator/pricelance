import { ingestionQueue } from "@/lib/ingestionQueue";
import { prisma } from "@/lib/db";
import {
  detectStaleMerchantFeedRuns,
  getScheduledIngestionMode,
  type StaleFeedRun,
} from "@/lib/ingestionScheduler";

export type QueueMetrics = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  repeatableJobs: number;
  totalJobs: number;
};

export type SchedulerStatus = {
  enabled: boolean;
  mode: "manual" | "hourly" | "daily";
  configuredRepeatableJobs: number;
  jobs: Array<{
    name: string;
    id: string;
    nextRunAt: string | null;
    everyMs: number | null;
  }>;
};

export type FailedJobRow = {
  id: string;
  name: string;
  attemptsMade: number;
  failedReason: string;
  timestamp: string | null;
  finishedOn: string | null;
  data: unknown;
};

export type FeedRunRow = {
  id: string;
  merchantId: string;
  merchantName: string | null;
  filename: string | null;
  rowsTotal: number;
  rowsImported: number;
  rowsFailed: number;
  createdAt: string;
};

export type FeedHealthRow = {
  merchantId: string;
  merchantName: string | null;
  lastRunAt: string;
  lastSuccessfulAt: string | null;
  lastFailedAt: string | null;
  status: "healthy" | "stale" | "failing";
  rowsImported: number;
  rowsFailed: number;
};

export type IngestionDashboardData = {
  queueMetrics: QueueMetrics;
  schedulerStatus: SchedulerStatus;
  staleFeeds: StaleFeedRun[];
  recentFailedJobs: FailedJobRow[];
  recentFeedRuns: FeedRunRow[];
  feedHealth: FeedHealthRow[];
};

function toNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

export async function getQueueMetrics(): Promise<QueueMetrics> {
  const counts = await (ingestionQueue.getJobCounts as any)(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused",
  );

  const waiting = toNumber(counts.waiting);
  const active = toNumber(counts.active);
  const completed = toNumber(counts.completed);
  const failed = toNumber(counts.failed);
  const delayed = toNumber(counts.delayed);
  const paused = toNumber(counts.paused);

  const repeatableJobs = Array.isArray(
    await (ingestionQueue.getRepeatableJobs as any)(),
  )
    ? ((await (ingestionQueue.getRepeatableJobs as any)()) as any[]).length
    : 0;

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
    repeatableJobs,
    totalJobs: waiting + active + completed + failed + delayed,
  };
}

export async function getSchedulerStatus(): Promise<SchedulerStatus> {
  const mode = getScheduledIngestionMode();
  const repeatableJobs = (await (ingestionQueue.getRepeatableJobs as any)()) as any[];

  return {
    enabled: mode !== "manual",
    mode,
    configuredRepeatableJobs: Array.isArray(repeatableJobs)
      ? repeatableJobs.length
      : 0,
    jobs: (Array.isArray(repeatableJobs) ? repeatableJobs : []).map(
      (job: any) => ({
        name: String(job.name ?? "unknown"),
        id: String(job.id ?? `${job.name}-${job.key ?? "repeat"}`),
        nextRunAt: job.next ? new Date(job.next).toISOString() : null,
        everyMs: typeof job.every === "number" ? job.every : null,
      }),
    ),
  };
}

export async function getRecentFailedJobs(
  limit = 10,
): Promise<FailedJobRow[]> {
  const failedJobs = await (ingestionQueue.getJobs as any)(
    ["failed"],
    0,
    limit - 1,
    false,
  );

  return (Array.isArray(failedJobs) ? failedJobs : []).map((job: any) => ({
    id: String(job.id ?? ""),
    name: String(job.name ?? ""),
    attemptsMade: toNumber(job.attemptsMade),
    failedReason: String(job.failedReason ?? job.failedReason ?? "Unknown failure"),
    timestamp: job.timestamp
      ? new Date(job.timestamp).toISOString()
      : null,
    finishedOn: job.finishedOn
      ? new Date(job.finishedOn).toISOString()
      : null,
    data: job.data,
  }));
}

export async function getRecentFeedRuns(
  limit = 12,
): Promise<FeedRunRow[]> {
  const feedRuns = await prisma.merchantFeedRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      merchant: {
        select: {
          name: true,
        },
      },
    },
  });

  return feedRuns.map((run) => ({
    id: run.id,
    merchantId: run.merchantId,
    merchantName: run.merchant?.name ?? null,
    filename: run.filename,
    rowsTotal: run.rowsTotal,
    rowsImported: run.rowsImported,
    rowsFailed: run.rowsFailed,
    createdAt: run.createdAt.toISOString(),
  }));
}

export async function getFeedHealthSummary(
  thresholdHours = Number(process.env.SCHEDULED_STALE_FEED_THRESHOLD_HOURS || 48),
): Promise<FeedHealthRow[]> {
  const recentRuns = await prisma.merchantFeedRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      merchant: {
        select: {
          name: true,
        },
      },
    },
  });

  const byMerchant = new Map<string, FeedHealthRow>();

  for (const run of recentRuns) {
    const existing = byMerchant.get(run.merchantId);
    if (existing) continue;

    const lastRunAt = run.createdAt;
    const lastFailedAt = run.rowsFailed > 0 ? run.createdAt : null;
    const lastSuccessfulAt = run.rowsFailed === 0 ? run.createdAt : null;
    const ageHours = Math.round(
      (Date.now() - lastRunAt.getTime()) / (60 * 60 * 1000),
    );
    let status: FeedHealthRow["status"] = "healthy";
    if (ageHours > thresholdHours) {
      status = "stale";
    } else if (run.rowsFailed > 0) {
      status = "failing";
    }

    byMerchant.set(run.merchantId, {
      merchantId: run.merchantId,
      merchantName: run.merchant?.name ?? null,
      lastRunAt: lastRunAt.toISOString(),
      lastSuccessfulAt: lastSuccessfulAt?.toISOString() ?? null,
      lastFailedAt: lastFailedAt?.toISOString() ?? null,
      status,
      rowsImported: run.rowsImported,
      rowsFailed: run.rowsFailed,
    });
  }

  return Array.from(byMerchant.values()).sort((a, b) =>
    a.status === b.status ? 0 : a.status === "failing" ? -1 : b.status === "failing" ? 1 : 0,
  );
}

export async function getIngestionDashboardData(
  staleThresholdHours = Number(process.env.SCHEDULED_STALE_FEED_THRESHOLD_HOURS || 48),
): Promise<IngestionDashboardData> {
  const [queueMetrics, schedulerStatus, staleFeeds, recentFailedJobs, recentFeedRuns, feedHealth] =
    await Promise.all([
      getQueueMetrics(),
      getSchedulerStatus(),
      detectStaleMerchantFeedRuns(staleThresholdHours),
      getRecentFailedJobs(10),
      getRecentFeedRuns(12),
      getFeedHealthSummary(staleThresholdHours),
    ]);

  return {
    queueMetrics,
    schedulerStatus,
    staleFeeds,
    recentFailedJobs,
    recentFeedRuns,
    feedHealth,
  };
}
