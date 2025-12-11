// src/app/admin/search-analytics/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchAnalyticsPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

type ZeroResultRow = {
  query: string;
  timesSearched: number;
  lastSearchedAt: Date | null;
};

type TopQueryRow = {
  query: string;
  timesSearched: number;
  averageResultCount: number;
};

// --- helpers using findMany instead of groupBy ------------------------------

async function getZeroResultQueries(): Promise<ZeroResultRow[]> {
  const logs = await (prisma as any).searchLog.findMany({
    where: { resultCount: 0 },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const map = new Map<string, ZeroResultRow>();

  for (const log of logs as any[]) {
    const q = log.query as string;
    const createdAt = log.createdAt as Date;

    const existing = map.get(q);
    if (!existing) {
      map.set(q, {
        query: q,
        timesSearched: 1,
        lastSearchedAt: createdAt ?? null,
      });
    } else {
      existing.timesSearched += 1;
      if (
        createdAt &&
        (!existing.lastSearchedAt ||
          createdAt > (existing.lastSearchedAt as Date))
      ) {
        existing.lastSearchedAt = createdAt;
      }
    }
  }

  const rows = Array.from(map.values());
  rows.sort((a, b) => b.timesSearched - a.timesSearched);
  return rows.slice(0, 50);
}

async function getTopQueries(): Promise<TopQueryRow[]> {
  const logs = await (prisma as any).searchLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  type Agg = { count: number; sumResults: number };
  const agg = new Map<string, Agg>();

  for (const log of logs as any[]) {
    const q = log.query as string;
    const resultCount = (log.resultCount as number) ?? 0;

    const existing = agg.get(q);
    if (!existing) {
      agg.set(q, { count: 1, sumResults: resultCount });
    } else {
      existing.count += 1;
      existing.sumResults += resultCount;
    }
  }

  const rows: TopQueryRow[] = [];
  for (const entry of Array.from(agg.entries())) {
    const query = entry[0];
    const { count, sumResults } = entry[1];
    rows.push({
      query,
      timesSearched: count,
      averageResultCount: count > 0 ? sumResults / count : 0,
    });
  }

  rows.sort((a, b) => b.timesSearched - a.timesSearched);
  return rows.slice(0, 50);
}

// --- page -------------------------------------------------------------------

export default async function SearchAnalyticsPage({
  searchParams,
}: SearchAnalyticsPageProps) {
  const adminSecret = process.env.ADMIN_SECRET;

  const providedKey =
    typeof searchParams?.adminKey === "string"
      ? searchParams.adminKey
      : undefined;

  if (process.env.NODE_ENV === "production") {
    if (!adminSecret || providedKey !== adminSecret) {
      notFound();
    }
  }

  const [zeroResultQueries, topQueries] = await Promise.all([
    getZeroResultQueries(),
    getTopQueries(),
  ]);

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

        <section className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase text-slate-400">
              Zero-result queries
            </div>
            <div className="mt-1 text-xl font-semibold">
              {zeroResultQueries.length}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Unique queries that returned 0 products (top 50 by frequency).
            </p>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">
              Tracked queries
            </div>
            <div className="mt-1 text-xl font-semibold">
              {topQueries.length}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Top 50 queries overall, sorted by how often they were searched.
            </p>
          </div>
          <div className="flex flex-col justify-between gap-2 text-xs text-slate-400">
            <p>
              Use this page to decide which queries to add to the curated
              catalog. Start with zero-result queries that appear multiple
              times.
            </p>
            <p>
              Tip: Click a query to jump to the curated catalog admin with the
              search pre-filled.
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
                              .toISOString()
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
                        {row.timesSearched}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {row.averageResultCount.toFixed(1)}
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
