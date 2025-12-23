// src/app/admin/system-check/page.tsx
// Auth is handled by middleware (HTTP Basic Auth in production, bypassed in dev)

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

type DbHealthResponse = {
  ok: boolean;
  productCount?: number;
  listingCount?: number;
  savedSearchCount?: number;
  favoriteCount?: number;
  error?: string;
};

type CatalogStatsResponse = {
  ok: boolean;
  totals?: {
    productCount: number;
    listingCount: number;
  };
  categories?: unknown[];
  error?: string;
};

type SearchAnalyticsSummary = {
  ok: boolean;
  totals?: {
    totalSearches: number;
    uniqueQueries: number;
    avgResultCount: number | null;
  };
  zeroResultQueries?: {
    query: string;
    timesSearched: number;
    lastSearchedAt: string | null;
  }[];
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
 * Fetch listing counts grouped by source (manual, sheet, affiliate, seed)
 */
async function fetchListingsBySource(): Promise<SourceStats[]> {
  try {
    const results = await prisma.listing.groupBy({
      by: ["source"],
      _count: { id: true },
    });
    return results.map((r) => ({
      source: r.source ?? "unknown",
      count: r._count.id,
    }));
  } catch (err) {
    console.error("[system-check] Failed to fetch listings by source:", err);
    return [];
  }
}

/**
 * Fetch listing counts grouped by affiliateProvider (for affiliate listings only)
 */
async function fetchListingsByAffiliateProvider(): Promise<AffiliateProviderStats[]> {
  try {
    const results = await prisma.listing.groupBy({
      by: ["affiliateProvider"],
      where: {
        affiliateProvider: { not: null },
      },
      _count: { id: true },
    });
    return results.map((r) => ({
      affiliateProvider: r.affiliateProvider ?? "unknown",
      count: r._count.id,
    }));
  } catch (err) {
    console.error("[system-check] Failed to fetch listings by affiliate provider:", err);
    return [];
  }
}

async function fetchInternalJson<T>(path: string): Promise<{ data: T | null; error: string | null }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: INTERNAL_API_KEY
        ? { "x-internal-key": INTERNAL_API_KEY }
        : undefined,
      cache: "no-store",
    });

    const json = (await res.json()) as T & { error?: string }; // tolerate extra fields

    if (!res.ok) {
      return {
        data: null,
        error: json && typeof json.error === "string" ? json.error : `Request failed with status ${res.status}`,
      };
    }

    return { data: json, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export default async function SystemCheckPage() {
  const [dbResult, catalogResult, analyticsResult, sourceStats, affiliateStats] = await Promise.all([
    fetchInternalJson<DbHealthResponse>("/api/internal/db-health"),
    fetchInternalJson<CatalogStatsResponse>("/api/internal/catalog-stats"),
    fetchInternalJson<SearchAnalyticsSummary>("/api/internal/search-analytics?days=7"),
    fetchListingsBySource(),
    fetchListingsByAffiliateProvider(),
  ]);

  const dbHealth = dbResult.data;
  const dbError = dbResult.error;

  const catalogStats = catalogResult.data;
  const catalogError = catalogResult.error;

  const analytics = analyticsResult.data;
  const analyticsError = analyticsResult.error;

  const zeroResultQueries = (analytics?.zeroResultQueries ?? []).slice(0, 3);

  const dbStatusLabel = dbHealth?.ok ? "Connected" : "Error";
  const dbStatusColor = dbHealth?.ok ? "text-emerald-400" : "text-red-400";

  const catalogProductCount = catalogStats?.totals?.productCount ?? null;
  const catalogListingCount = catalogStats?.totals?.listingCount ?? null;

  const totalSearches = analytics?.totals?.totalSearches ?? 0;
  const uniqueQueries = analytics?.totals?.uniqueQueries ?? 0;
  const avgResultCount = analytics?.totals?.avgResultCount ?? null;

  // Compute total products and listings from direct Prisma queries
  const totalProducts = catalogProductCount ?? 0;
  const totalListings = catalogListingCount ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl p-6 space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">System Check</h1>
          <p className="text-sm text-slate-400">
            Quick view of catalog, database, and search coverage health.
          </p>
        </header>

        <section className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200 md:grid-cols-3">
          {/* Database card */}
          <div>
            <div className="text-xs uppercase text-slate-400">Database</div>
            <div className={`mt-1 text-xl font-semibold ${dbStatusColor}`}>
              {dbStatusLabel}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {dbHealth?.ok
                ? "Prisma can reach the database and read main tables."
                : "Database health endpoint reported an error."}
            </p>
            {typeof dbHealth?.productCount === "number" && (
              <p className="mt-1 text-xs text-slate-400">
                Products: {dbHealth.productCount}, Listings: {dbHealth.listingCount ?? "-"}
              </p>
            )}
            {dbError && (
              <p className="mt-1 text-xs text-red-400">Failed to load DB health: {dbError}</p>
            )}
          </div>

          {/* Catalog card */}
          <div>
            <div className="text-xs uppercase text-slate-400">Catalog</div>
            <div className="mt-1 text-xl font-semibold">
              {catalogProductCount != null ? catalogProductCount : "—"}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Total products currently in the catalog.
            </p>
            {catalogListingCount != null && (
              <p className="mt-1 text-xs text-slate-400">
                Listings: {catalogListingCount}
              </p>
            )}
            {catalogError && (
              <p className="mt-1 text-xs text-red-400">Failed to load catalog stats: {catalogError}</p>
            )}
          </div>

          {/* Search card */}
          <div>
            <div className="text-xs uppercase text-slate-400">Search (last 7 days)</div>
            <div className="mt-1 text-xl font-semibold">{totalSearches}</div>
            <p className="mt-1 text-xs text-slate-400">
              Total searches logged in the last 7 days.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Unique queries: {uniqueQueries}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Avg results per search: {avgResultCount != null ? avgResultCount.toFixed(1) : "—"}
            </p>
            {analyticsError && (
              <p className="mt-1 text-xs text-red-400">Failed to load search analytics: {analyticsError}</p>
            )}
          </div>
        </section>

        {/* Affiliate & Source Stats */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase text-slate-400">
            Listings by Source
          </h2>
          <p className="text-[11px] text-slate-500">
            Affiliate stats are based on Listing.source and affiliateProvider fields.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Source breakdown table */}
            <div className="overflow-hidden rounded border border-slate-800 bg-slate-900/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2 text-right">Listings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/80">
                  {sourceStats.length > 0 ? (
                    sourceStats.map((row) => (
                      <tr key={row.source}>
                        <td className="px-3 py-2">{row.source}</td>
                        <td className="px-3 py-2 text-right">{row.count}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center text-sm text-slate-500">
                        No source data available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Affiliate provider breakdown table */}
            <div className="overflow-hidden rounded border border-slate-800 bg-slate-900/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Affiliate Provider</th>
                    <th className="px-3 py-2 text-right">Listings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/80">
                  {affiliateStats.length > 0 ? (
                    affiliateStats.map((row) => (
                      <tr key={row.affiliateProvider}>
                        <td className="px-3 py-2">{row.affiliateProvider}</td>
                        <td className="px-3 py-2 text-right">{row.count}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center text-sm text-slate-500">
                        No affiliate listings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase text-slate-400">
            Top zero-result queries (last 7 days)
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
                      <a
                        href={`/admin/catalog?q=${encodeURIComponent(row.query)}`}
                        className="text-sky-400 hover:underline"
                      >
                        {row.query}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-sm">{row.timesSearched}</td>
                    <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap">
                      {row.lastSearchedAt
                        ? row.lastSearchedAt.slice(0, 19).replace("T", " ")
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
                      No zero-result queries in the last 7 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500">
            These are strong candidates for expanding curated coverage in the catalog.
          </p>
        </section>
      </div>
    </div>
  );
}
