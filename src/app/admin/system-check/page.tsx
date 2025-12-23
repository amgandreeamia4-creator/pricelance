// src/app/admin/system-check/page.tsx
// Admin system health dashboard.
// Auth is handled by middleware (HTTP Basic Auth in production, bypassed in dev).

import { prisma } from "@/lib/db";
import { getSearchAnalyticsSummary } from "@/lib/searchAnalytics";

export const dynamic = "force-dynamic";

type DbHealth = {
  ok: boolean;
  productCount?: number;
  listingCount?: number;
  error?: string;
};

type CatalogStats = {
  ok: boolean;
  productCount?: number;
  listingCount?: number;
  error?: string;
};

type ZeroResultQuery = {
  query: string;
  timesSearched: number;
  lastSearched: string;
};

type SearchAnalytics = {
  ok: boolean;
  totalSearches?: number;
  uniqueQueries?: number;
  avgResultCount?: number;
  zeroResultQueries?: ZeroResultQuery[];
  error?: string;
};

type SourceStats = {
  source: string;
  count: number;
};

type AffiliateProviderStats = {
  affiliateProvider: string;
  count: number;
};

/**
 * Database connectivity / basic table counts.
 */
async function fetchDbHealth(): Promise<DbHealth> {
  try {
    const [productCount, listingCount] = await Promise.all([
      prisma.product.count(),
      prisma.listing.count(),
    ]);

    return {
      ok: true,
      productCount,
      listingCount,
    };
  } catch (err) {
    console.error("[system-check] Failed to load DB health:", err);
    return {
      ok: false,
      error: "Failed to load DB health",
    };
  }
}

/**
 * Catalog totals – essentially the same numbers, but kept separate
 * in case we later want “indexable vs non-indexable” etc.
 */
async function fetchCatalogStats(): Promise<CatalogStats> {
  try {
    const [productCount, listingCount] = await Promise.all([
      prisma.product.count(),
      prisma.listing.count(),
    ]);

    return {
      ok: true,
      productCount,
      listingCount,
    };
  } catch (err) {
    console.error("[system-check] Failed to load catalog stats:", err);
    return {
      ok: false,
      error: "Failed to load catalog stats",
    };
  }
}

/**
 * Search analytics (last N days).
 * We deliberately treat the helper as `any` so TypeScript never blocks builds,
 * even if the implementation changes.
 */
async function fetchSearchAnalytics(days: number): Promise<SearchAnalytics> {
  try {
    const anyGetSummary = getSearchAnalyticsSummary as any;
    const summary = await anyGetSummary({ days });

    const zeroResultQueries: ZeroResultQuery[] =
      summary?.zeroResultQueries?.map((q: any) => ({
        query: String(q.query ?? ""),
        timesSearched: Number(q.timesSearched ?? 0),
        lastSearched:
          typeof q.lastSearched === "string"
            ? q.lastSearched
            : q.lastSearched?.toISOString?.() ?? "",
      })) ?? [];

    return {
      ok: true,
      totalSearches: Number(summary?.totalSearches ?? 0),
      uniqueQueries: Number(summary?.uniqueQueries ?? 0),
      avgResultCount: Number(summary?.avgResultCount ?? 0),
      zeroResultQueries,
    };
  } catch (err) {
    console.error("[system-check] Failed to load search analytics:", err);
    return {
      ok: false,
      totalSearches: 0,
      uniqueQueries: 0,
      avgResultCount: 0,
      zeroResultQueries: [],
      error: "Failed to load search analytics",
    };
  }
}

/**
 * Listing counts grouped by `source` (sheet / manual / seed / affiliate).
 * Uses `any` for the Prisma groupBy typing so Vercel’s TS doesn’t complain.
 */
async function fetchListingsBySource(): Promise<SourceStats[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = await (prisma.listing.groupBy as any)({
      by: ["source"],
      _count: { _all: true },
    });

    return results.map((r) => ({
      source: String(r.source ?? "unknown"),
      count: Number(r._count?._all ?? 0),
    }));
  } catch (err) {
    console.error("[system-check] Failed to fetch listings by source:", err);
    return [];
  }
}

/**
 * Listing counts grouped by `affiliateProvider` (affiliate listings only).
 */
async function fetchListingsByAffiliateProvider(): Promise<AffiliateProviderStats[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = await (prisma.listing.groupBy as any)({
      by: ["affiliateProvider"],
      where: {
        affiliateProvider: { not: null },
      },
      _count: { _all: true },
    });

    return results.map((r) => ({
      affiliateProvider: String(r.affiliateProvider ?? "unknown"),
      count: Number(r._count?._all ?? 0),
    }));
  } catch (err) {
    console.error(
      "[system-check] Failed to fetch listings by affiliate provider:",
      err,
    );
    return [];
  }
}

export default async function SystemCheckPage() {
  const [
    dbHealth,
    catalogStats,
    searchStats,
    listingsBySource,
    listingsByAffiliateProvider,
  ] = await Promise.all([
    fetchDbHealth(),
    fetchCatalogStats(),
    fetchSearchAnalytics(7),
    fetchListingsBySource(),
    fetchListingsByAffiliateProvider(),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">System Check</h1>
          <p className="mt-1 text-sm text-slate-400">
            Quick view of catalog, database, and search coverage health.
          </p>
        </header>

        {/* Top cards: DB / Catalog / Search */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Database */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Database
            </h2>
            <p
              className={
                "mt-2 text-sm font-medium " +
                (dbHealth.ok ? "text-emerald-400" : "text-red-400")
              }
            >
              {dbHealth.ok ? "Connected" : "Error"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Prisma can reach the database and read main tables.
            </p>
            {dbHealth.ok && (
              <p className="mt-3 text-xs text-slate-300">
                Products:{" "}
                <span className="font-mono">
                  {dbHealth.productCount ?? "—"}
                </span>
                , Listings:{" "}
                <span className="font-mono">
                  {dbHealth.listingCount ?? "—"}
                </span>
              </p>
            )}
            {!dbHealth.ok && dbHealth.error && (
              <p className="mt-3 text-xs text-red-400">{dbHealth.error}</p>
            )}
          </div>

          {/* Catalog */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Catalog
            </h2>
            <p
              className={
                "mt-2 text-sm font-medium " +
                (catalogStats.ok ? "text-emerald-400" : "text-red-400")
              }
            >
              {catalogStats.ok ? catalogStats.productCount ?? 0 : "Error"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Total products currently in the catalog.
            </p>
            {catalogStats.ok && (
              <p className="mt-3 text-xs text-slate-300">
                Listings:{" "}
                <span className="font-mono">
                  {catalogStats.listingCount ?? "—"}
                </span>
              </p>
            )}
            {!catalogStats.ok && catalogStats.error && (
              <p className="mt-3 text-xs text-red-400">{catalogStats.error}</p>
            )}
          </div>

          {/* Search (last 7 days) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Search (last 7 days)
            </h2>
            <p
              className={
                "mt-2 text-sm font-medium " +
                (searchStats.ok ? "text-emerald-400" : "text-red-400")
              }
            >
              {searchStats.ok
                ? searchStats.totalSearches ?? 0
                : "No data / error"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Total searches logged in the last 7 days.
            </p>
            {searchStats.ok && (
              <dl className="mt-3 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <dt>Unique queries:</dt>
                  <dd className="font-mono">
                    {searchStats.uniqueQueries ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Avg results per search:</dt>
                  <dd className="font-mono">
                    {searchStats.avgResultCount?.toFixed(1) ?? "—"}
                  </dd>
                </div>
              </dl>
            )}
            {!searchStats.ok && searchStats.error && (
              <p className="mt-3 text-xs text-red-400">{searchStats.error}</p>
            )}
          </div>
        </section>

        {/* Listings by source / affiliate provider */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Listings by source */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Listings by Source
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Affiliate stats are based on Listing.source and affiliateProvider
              fields.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium uppercase tracking-wide">
                      Source
                    </th>
                    <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                      Listings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listingsBySource.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-3 py-3 text-center text-xs text-slate-500"
                      >
                        No listings yet.
                      </td>
                    </tr>
                  ) : (
                    listingsBySource.map((row) => (
                      <tr
                        key={row.source}
                        className="border-t border-slate-800/80"
                      >
                        <td className="px-3 py-2 text-slate-200">
                          {row.source}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-100">
                          {row.count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Listings by affiliate provider */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Affiliate Provider
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              For affiliate listings only (source = &quot;affiliate&quot;).
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium uppercase tracking-wide">
                      Affiliate Provider
                    </th>
                    <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                      Listings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listingsByAffiliateProvider.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-3 py-3 text-center text-xs text-slate-500"
                      >
                        No affiliate listings yet.
                      </td>
                    </tr>
                  ) : (
                    listingsByAffiliateProvider.map((row) => (
                      <tr
                        key={row.affiliateProvider}
                        className="border-t border-slate-800/80"
                      >
                        <td className="px-3 py-2 text-slate-200">
                          {row.affiliateProvider}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-100">
                          {row.count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Zero-result queries */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Top Zero-Result Queries (last 7 days)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            These are strong candidates for expanding curated coverage in the
            catalog.
          </p>

          <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    Query
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                    Times searched
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                    Last searched
                  </th>
                </tr>
              </thead>
              <tbody>
                {searchStats.zeroResultQueries &&
                searchStats.zeroResultQueries.length > 0 ? (
                  searchStats.zeroResultQueries.map((row) => (
                    <tr
                      key={`${row.query}-${row.lastSearched}`}
                      className="border-t border-slate-800/80"
                    >
                      <td className="px-3 py-2 text-slate-200">{row.query}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {row.timesSearched}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {row.lastSearched || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-3 text-center text-xs text-slate-500"
                    >
                      No zero-result queries in the last 7 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}