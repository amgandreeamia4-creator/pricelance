import { getIngestionDashboardData } from "@/lib/ingestionMonitoring";

function statusLabel(status: string) {
  if (status === "healthy") return "Healthy";
  if (status === "stale") return "Stale";
  if (status === "failing") return "Failing";
  return status;
}

function badgeClass(status: string) {
  if (status === "healthy") return "bg-emerald-500/15 text-emerald-300";
  if (status === "stale") return "bg-amber-500/15 text-amber-300";
  if (status === "failing") return "bg-red-500/15 text-red-300";
  return "bg-slate-500/15 text-slate-300";
}

export default async function IngestionMonitorPanel() {
  const data = await getIngestionDashboardData();

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-100">
            Ingestion & Queue Health
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Operational visibility for queue metrics, scheduler state, stale feeds, and recent failures.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Queue pending</p>
            <p className="mt-2 text-xl font-semibold text-white">{data.queueMetrics.waiting}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Running</p>
            <p className="mt-2 text-xl font-semibold text-white">{data.queueMetrics.active}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Failed</p>
            <p className="mt-2 text-xl font-semibold text-white">{data.queueMetrics.failed}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Scheduler mode</p>
              <p className="mt-1 text-lg font-semibold text-white">{data.schedulerStatus.mode}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                data.schedulerStatus.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-600 text-slate-300"
              }`}
            >
              {data.schedulerStatus.enabled ? "Enabled" : "Manual"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-400">
            <div>
              <p className="font-medium text-slate-200">Repeatable jobs</p>
              <p className="mt-1 text-2xl text-white">{data.schedulerStatus.configuredRepeatableJobs}</p>
            </div>
            <div>
              <p className="font-medium text-slate-200">Stale feeds</p>
              <p className="mt-1 text-2xl text-white">{data.staleFeeds.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Queue totals</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl bg-slate-900/90 p-3">
              <p className="text-slate-400">Completed</p>
              <p className="mt-2 text-2xl font-semibold text-white">{data.queueMetrics.completed}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/90 p-3">
              <p className="text-slate-400">Delayed</p>
              <p className="mt-2 text-2xl font-semibold text-white">{data.queueMetrics.delayed}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/90 p-3">
              <p className="text-slate-400">Paused</p>
              <p className="mt-2 text-2xl font-semibold text-white">{data.queueMetrics.paused}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/90 p-3">
              <p className="text-slate-400">Repeat jobs</p>
              <p className="mt-2 text-2xl font-semibold text-white">{data.queueMetrics.repeatableJobs}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Recent failed jobs</h3>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/90 text-slate-500">
                <tr>
                  <th className="px-3 py-3">Job</th>
                  <th className="px-3 py-3">Attempts</th>
                  <th className="px-3 py-3">Failed</th>
                </tr>
              </thead>
              <tbody>
                {data.recentFailedJobs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-slate-500">
                      No recent failed jobs.
                    </td>
                  </tr>
                ) : (
                  data.recentFailedJobs.map((job) => (
                    <tr key={job.id} className="border-t border-slate-800">
                      <td className="px-3 py-3 text-slate-100">{job.name}</td>
                      <td className="px-3 py-3">{job.attemptsMade}</td>
                      <td className="px-3 py-3">{job.failedReason || "Unknown"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Feed health</h3>
          <div className="mt-4 space-y-3">
            {data.feedHealth.length === 0 ? (
              <p className="text-sm text-slate-400">No recent run data available.</p>
            ) : (
              data.feedHealth.slice(0, 5).map((row) => (
                <div
                  key={`${row.merchantId}-${row.lastRunAt}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-100">
                      {row.merchantName ?? row.merchantId}
                    </p>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${badgeClass(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Last run: {row.lastRunAt}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
        <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Recent feed runs
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/90 text-slate-500">
              <tr>
                <th className="px-3 py-3">Merchant</th>
                <th className="px-3 py-3">Imported</th>
                <th className="px-3 py-3">Failed</th>
                <th className="px-3 py-3">Run time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentFeedRuns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-slate-500">
                    No feed run history found.
                  </td>
                </tr>
              ) : (
                data.recentFeedRuns.map((run) => (
                  <tr key={run.id} className="border-t border-slate-800">
                    <td className="px-3 py-3 text-slate-100">
                      {run.merchantName ?? run.merchantId}
                    </td>
                    <td className="px-3 py-3">{run.rowsImported}</td>
                    <td className="px-3 py-3">{run.rowsFailed}</td>
                    <td className="px-3 py-3 text-slate-400">{run.createdAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
