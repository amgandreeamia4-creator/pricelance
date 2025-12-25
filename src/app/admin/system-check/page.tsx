// src/app/admin/system-check/page.tsx
// Admin system health dashboard.
// Auth is handled by middleware (HTTP Basic Auth in production, bypassed in dev).
import { isAdminKeyValid, isAdminAuthConfigured } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { getSearchAnalyticsSummary } from "@/lib/searchAnalytics";
import { CANONICAL_CATEGORIES, CATEGORY_LABELS } from "@/config/categories";

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

type FreshnessOverview = {
  ok: boolean;
  totalListingsWithFreshness?: number;
  totalListings?: number;
  oldestPriceLastSeenAt?: string | null;
  newestPriceLastSeenAt?: string | null;
  error?: string;
};

type StoreFreshnessRow = {
  storeName: string;
  listingCount: number;
  listingsWithFreshness: number;
  oldestPriceLastSeenAt: string | null;
};

type CategoryCoverageRow = {
  category: string;
  label: string;
  totalProducts: number;
  productsWithListings: number;
  productsWithMultipleListings: number;
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

/**
 * Global price freshness overview for listings.
 */
async function fetchFreshnessOverview(): Promise<FreshnessOverview> {
  try {
    const [totalListings, totalListingsWithFreshness, oldest, newest] =
      await Promise.all([
        prisma.listing.count(),
        // Relax Prisma typing for new priceLastSeenAt field
        (prisma.listing.count as any)({
          where: { priceLastSeenAt: { not: null } },
        }),
        (prisma.listing.findFirst as any)({
          where: { priceLastSeenAt: { not: null } },
          orderBy: { priceLastSeenAt: "asc" },
          select: { priceLastSeenAt: true },
        }),
        (prisma.listing.findFirst as any)({
          where: { priceLastSeenAt: { not: null } },
          orderBy: { priceLastSeenAt: "desc" },
          select: { priceLastSeenAt: true },
        }),
      ]);

    const oldestIso =
      oldest?.priceLastSeenAt != null
        ? oldest.priceLastSeenAt.toISOString()
        : null;
    const newestIso =
      newest?.priceLastSeenAt != null
        ? newest.priceLastSeenAt.toISOString()
        : null;

    return {
      ok: true,
      totalListings,
      totalListingsWithFreshness,
      oldestPriceLastSeenAt: oldestIso,
      newestPriceLastSeenAt: newestIso,
    };
  } catch (err) {
    console.error("[system-check] Failed to fetch freshness overview:", err);
    return {
      ok: false,
      error: "Failed to load freshness overview",
    };
  }
}

/**
 * Per-store freshness stats (counts and oldest seen price per store).
 */
async function fetchStoreFreshness(): Promise<StoreFreshnessRow[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups: any[] = await (prisma.listing.groupBy as any)({
      by: ["storeName"],
      _count: { _all: true },
    });

    const results: StoreFreshnessRow[] = [];

    for (const group of groups) {
      const storeName = String(group.storeName ?? "Unknown");
      const listingCount = Number(group._count?._all ?? 0);

      const [withFreshness, oldest] = await Promise.all([
        // Relax Prisma typing for new priceLastSeenAt field
        (prisma.listing.count as any)({
          where: {
            storeName,
            priceLastSeenAt: { not: null },
          },
        }),
        (prisma.listing.findFirst as any)({
          where: {
            storeName,
            priceLastSeenAt: { not: null },
          },
          orderBy: { priceLastSeenAt: "asc" },
          select: { priceLastSeenAt: true },
        }),
      ]);

      results.push({
        storeName,
        listingCount,
        listingsWithFreshness: withFreshness,
        oldestPriceLastSeenAt:
          oldest?.priceLastSeenAt != null
            ? oldest.priceLastSeenAt.toISOString()
            : null,
      });
    }

    // Sort by listing count desc for a stable table order
    return results.sort((a, b) => b.listingCount - a.listingCount);
  } catch (err) {
    console.error("[system-check] Failed to fetch store freshness:", err);
    return [];
  }
}

/**
 * Coverage stats per canonical category.
 */
async function fetchCategoryCoverage(): Promise<CategoryCoverageRow[]> {
  try {
    const rows: CategoryCoverageRow[] = [];

    for (const slug of CANONICAL_CATEGORIES) {
      const products = await prisma.product.findMany({
        where: { category: slug },
        select: {
          id: true,
          listings: {
            select: { id: true },
          },
        },
      });

      const totalProducts = products.length;
      let withListings = 0;
      let withMultipleListings = 0;

      for (const p of products) {
        const listingCount = Array.isArray(p.listings)
          ? p.listings.length
          : 0;
        if (listingCount >= 1) withListings++;
        if (listingCount >= 2) withMultipleListings++;
      }

      rows.push({
        category: slug,
        label: CATEGORY_LABELS[slug],
        totalProducts,
        productsWithListings: withListings,
        productsWithMultipleListings: withMultipleListings,
      });
    }

    return rows;
  } catch (err) {
    console.error("[system-check] Failed to fetch category coverage:", err);
    return [];
  }
}

type AdminPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function SystemCheckPage({
  searchParams,
}: AdminPageProps) {
  const keyParam = searchParams?.key;
  const key = Array.isArray(keyParam) ? keyParam[0] : keyParam;

  const isProd = process.env.NODE_ENV === "production";
  const hasAuthConfigured = isAdminAuthConfigured();
  const shouldEnforceKey = isProd && hasAuthConfigured;

  if (shouldEnforceKey && !isAdminKeyValid(key)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold">Admin key required</h1>
          <p className="text-sm text-muted-foreground">
            This admin area is protected. Add {" "}
            <code>?key=YOUR_ADMIN_PASSWORD</code> to the URL using the same
            value as the <code>ADMIN_PASSWORD</code> (or <code>ADMIN_SECRET</code>) environment
            variable.
          </p>
        </div>
      </main>
    );
  }

  const [
    dbHealth,
    catalogStats,
    searchStats,
    listingsBySource,
    listingsByAffiliateProvider,
    freshnessOverview,
    storeFreshness,
    categoryCoverage,
  ] = await Promise.all([
    fetchDbHealth(),
    fetchCatalogStats(),
    fetchSearchAnalytics(7),
    fetchListingsBySource(),
    fetchListingsByAffiliateProvider(),
    fetchFreshnessOverview(),
    fetchStoreFreshness(),
    fetchCategoryCoverage(),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">System Check</h1>
          <p className="mt-1 text-sm text-slate-400">
            Quick view of catalog, database, search, freshness, and coverage
            health.
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
                Products: {" "}
                <span className="font-mono">
                  {dbHealth.productCount ?? "—"}
                </span>
                , Listings: {" "}
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
                Listings: {" "}
                <span className="font-mono">
                  {catalogStats.listingCount ?? "—"}
                </span>
              </p>
            )}
            {!catalogStats.ok && catalogStats.error && (
              <p className="mt-3 text-xs text-red-400">
                {catalogStats.error}
              </p>
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
              <p className="mt-3 text-xs text-red-400">
                {searchStats.error}
              </p>
            )}
          </div>
        </section>

        {/* Freshness overview + store freshness */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Global freshness overview */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Freshness Overview
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              How many listings have an explicit priceLastSeenAt timestamp.
            </p>
            {freshnessOverview.ok ? (
              <dl className="mt-3 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <dt>Listings with freshness:</dt>
                  <dd className="font-mono">
                    {freshnessOverview.totalListingsWithFreshness ?? 0} / {" "}
                    {freshnessOverview.totalListings ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Oldest price seen:</dt>
                  <dd className="font-mono">
                    {freshnessOverview.oldestPriceLastSeenAt ?? "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Newest price seen:</dt>
                  <dd className="font-mono">
                    {freshnessOverview.newestPriceLastSeenAt ?? "N/A"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-xs text-red-400">
                {freshnessOverview.error ?? "Freshness stats unavailable"}
              </p>
            )}
          </div>

          {/* Store freshness table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm md:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Store Freshness
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Per-store listing counts and the oldest priceLastSeenAt value.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium uppercase tracking-wide">
                      Store
                    </th>
                    <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                      Listings (fresh / total)
                    </th>
                    <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                      Oldest price seen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {storeFreshness.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-3 text-center text-xs text-slate-500"
                      >
                        No listings yet.
                      </td>
                    </tr>
                  ) : (
                    storeFreshness.map((row) => (
                      <tr
                        key={row.storeName}
                        className="border-t border-slate-800/80"
                      >
                        <td className="px-3 py-2 text-slate-200">
                          {row.storeName}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-100">
                          {row.listingsWithFreshness}/{row.listingCount}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-100">
                          {row.oldestPriceLastSeenAt ?? "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
              For affiliate listings only (source = "affiliate").
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

        {/* Category coverage */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Category Coverage
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Products per canonical category and how many have one or more
            listings.
          </p>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                    Products
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                    With ≥ 1 listing
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                    With ≥ 2 listings
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryCoverage.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-3 text-center text-xs text-slate-500"
                    >
                      No category data yet.
                    </td>
                  </tr>
                ) : (
                  categoryCoverage.map((row) => (
                    <tr
                      key={row.category}
                      className="border-t border-slate-800/80"
                    >
                      <td className="px-3 py-2 text-slate-200">
                        {row.label}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {row.totalProducts}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {row.productsWithListings}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {row.productsWithMultipleListings}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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