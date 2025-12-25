// src/app/admin/search-analytics/page.tsx
// Auth is handled by middleware (HTTP Basic Auth in production)
import Link from "next/link";

export const dynamic = "force-dynamic";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

type SearchAnalyticsSummary = {
  ok: boolean;
  range?: {
    days: number;
    since: string;
    until: string;
  } | null;
  totals?: {
    totalSearches: number;
    uniqueQueries: number;
    avgResultCount: number | null;
  } | null;
  topQueries?: { query: string; count: number; avgResultCount: number | null }[] | null;
  zeroResultQueries?: {
    query: string;
    timesSearched: number;
    lastSearchedAt: string | null;
  }[] | null;
  error?: string | null;
};

// Safe number extraction
function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

// Safe string extraction
function safeString(value: unknown, fallback: string = ""): string {
  if (typeof value === "string") return value;
  return fallback;
}

// --- page -------------------------------------------------------------------

export default async function SearchAnalyticsPage() {
  const days = 7;

  let summary: SearchAnalyticsSummary | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/internal/search-analytics?days=${days}`,
      {
        method: "GET",
        headers: INTERNAL_API_KEY
          ? { "x-internal-key": INTERNAL_API_KEY }
          : undefined,
        cache: "no-store",
      },
    );

    if (!res.ok) {
      fetchError = `API returned status ${res.status}`;
      console.error("[admin/search-analytics] API error:", fetchError);
    } else {
      const json = await res.json();
      summary = json as SearchAnalyticsSummary;
    }
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Unknown fetch error";
    console.error("[admin/search-analytics] Failed to fetch summary:", fetchError);
  }

  // Determine if we have an error state
  const hasError = fetchError !== null || summary?.ok === false;
  const errorMessage = fetchError ?? safeString(summary?.error, "Unknown error");

  // Safely extract data with fallbacks
  const zeroResultQueries = Array.isArray(summary?.zeroResultQueries)
    ? summary.zeroResultQueries
    : [];
  const topQueries = Array.isArray(summary?.topQueries) ? summary.topQueries : [];
  const totalSearches = safeNumber(summary?.totals?.totalSearches, 0);
  const uniqueQueries = safeNumber(summary?.totals?.uniqueQueries, 0);
  const avgResultCount = summary?.totals?.avgResultCount ?? null;

  // Check if there's any data at all
  const hasNoData = totalSearches === 0 && topQueries.length === 0 && zeroResultQueries.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl p-6 space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Search Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Understand what people search for, which queries have no coverage,
            and where to expand the curated catalog next.
          </p>
        </header>

        {/* Error banner */}
        {hasError && (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-lg">⚠</span>
              <div>
                <h3 className="font-semibold text-red-300">
                  Failed to load analytics
                </h3>
                <p className="mt-1 text-red-400/80">{errorMessage}</p>
                <p className="mt-2 text-xs text-slate-500">
                  The data below may be incomplete or stale.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No data message */}
        {!hasError && hasNoData && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-slate-200">No data yet</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
              Search analytics will appear here once users start searching. 
              Try searching for products on the homepage to generate some data.
            </p>
          </div>
        )}

        <section className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase text-slate-400">
              Total searches (last {days} days)
            </div>
            <div className="mt-1 text-xl font-semibold">
              {totalSearches}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Number of search requests logged in the selected time window.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">
              Unique queries
            </div>
            <div className="mt-1 text-xl font-semibold">
              {uniqueQueries}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Distinct normalized queries seen in this period.
            </p>
          </div>
          <div className="flex flex-col justify-between gap-2 text-xs text-slate-400">
            <p>
              Average results per search: {avgResultCount != null
                ? avgResultCount.toFixed(1)
                : "—"}
            </p>
            <p>
              Use this page to decide which queries to add to the curated
              catalog. Start with zero-result queries that appear multiple
              times.
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase text-slate-400">
              Zero result queries
            </h2>
            <div className="overflow-hidden rounded border border-slate-800 bg-slate-900/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Query</th>
                    <th className="px-3 py-2">Times searched</th>
                    <th className="px-3 py-2">Last searched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/80">
                  {zeroResultQueries.map((row) => (
                    <tr key={row.query}>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/catalog?q=${encodeURIComponent(
                            row.query,
                          )}`}
                          className="text-sky-400 hover:underline"
                        >
                          {row.query}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {row.timesSearched}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap">
                        {row.lastSearchedAt
                          ? row.lastSearchedAt
                              .slice(0, 19)
                              .replace("T", " ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {zeroResultQueries.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-6 text-center text-sm text-slate-500"
                      >
                        No zero-result queries logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500">
              These are the best candidates for new curated categories and
              products.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase text-slate-400">
              Top searched queries (overall)
            </h2>
            <div className="overflow-hidden rounded border border-slate-800 bg-slate-900/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Query</th>
                    <th className="px-3 py-2">Times searched</th>
                    <th className="px-3 py-2">Avg results</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/80">
                  {topQueries.map((row) => (
                    <tr key={row.query}>
                      <td className="px-3 py-2">
                        <span>{row.query}</span>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {row.count}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {row.avgResultCount != null
                          ? row.avgResultCount.toFixed(1)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {topQueries.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-6 text-center text-sm text-slate-500"
                      >
                        No search analytics data yet. Perform some searches in
                        the main app to populate this.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500">
              High-frequency queries with low average result counts are good
              candidates for expanding curated coverage.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}