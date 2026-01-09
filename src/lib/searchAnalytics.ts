// src/lib/searchAnalytics.ts
import type { SavedSearch, SearchLog } from "@prisma/client";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export type TopQuery = {
  query: string;
  count: number;
};

export type UserRecentSearch = {
  query: string;
  createdAt: Date;
};

// Pure helper that mirrors the internal analytics logic for computing top queries.
export function computeTopQueries(
  searches: Pick<SavedSearch, "query">[]
): TopQuery[] {
  const counts = new Map<string, number>();

  for (const s of searches) {
    const q = (s.query || "").trim() || "(empty)";
    counts.set(q, (counts.get(q) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Shared analytics for a (possibly anonymous) user.
// - topQueries: global, computed from recent saved searches
// - recentSearches: last 10 searches for the given userId
export async function getSearchAnalyticsForUser(userId: string | null) {
  const [recentForCounts, userRecent] = await Promise.all([
    prisma.savedSearch.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    userId
      ? prisma.savedSearch.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : Promise.resolve([] as SavedSearch[]),
  ]);

  const topQueries = computeTopQueries(recentForCounts);

  const recentSearches: UserRecentSearch[] = userRecent.map((s) => ({
    query: s.query,
    createdAt: s.createdAt,
  }));

  return { topQueries, recentSearches };
}

// Lightweight helper to log a single search event into SearchLog.
// This is used by the canonical GET /api/products endpoint.
// IMPORTANT: This function NEVER throws - all errors are caught and logged.
export async function logSearchEvent(params: {
  query: string;
  resultCount: number;
}): Promise<void> {
  try {
    // Safely extract and validate query
    const rawQuery = params?.query;
    const trimmedQuery =
      typeof rawQuery === "string" ? rawQuery.trim().slice(0, 500) : "";

    // Safely extract and clamp resultCount to non-negative integer
    const rawCount = params?.resultCount;
    const safeResultCount =
      typeof rawCount === "number" && Number.isFinite(rawCount)
        ? Math.max(0, Math.min(Math.trunc(rawCount), 1_000_000))
        : 0;

    await prisma.searchLog.create({
      data: {
        id: randomUUID(),
        query: trimmedQuery,
        resultCount: safeResultCount,
      },
    });
  } catch (error) {
    // Never throw - just log to console
    console.error(
      "[logSearchEvent] Failed to log search event (non-fatal):",
      error instanceof Error ? error.message : error
    );
  }
}

// --- Global search analytics based on SearchLog ------------------------------

export type SearchLogTopQuery = {
  query: string;
  count: number;
  avgResultCount: number | null;
};

export type SearchLogZeroResultQuery = {
  query: string;
  timesSearched: number;
  lastSearchedAt: Date | null;
};

export type SearchAnalyticsSummary = {
  ok: true;
  range: {
    days: number;
    since: Date;
    until: Date;
  };
  totals: {
    totalSearches: number;
    uniqueQueries: number;
    avgResultCount: number | null;
  };
  topQueries: SearchLogTopQuery[];
  zeroResultQueries: SearchLogZeroResultQuery[];
};

const MAX_ANALYTICS_DAYS = 90;

// Empty/default response for when there's no data or an error occurs
function emptyAnalyticsSummary(days: number, since: Date, until: Date): SearchAnalyticsSummary {
  return {
    ok: true,
    range: { days, since, until },
    totals: {
      totalSearches: 0,
      uniqueQueries: 0,
      avgResultCount: null,
    },
    topQueries: [],
    zeroResultQueries: [],
  };
}

// Safely extract a non-negative integer from a potentially corrupt value
function safeNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

// Safely extract a string from a potentially corrupt value
function safeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value;
}

// Safely extract a Date or null from a potentially corrupt value
function safeDateOrNull(value: unknown): Date | null {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export async function getSearchAnalyticsSummary(
  days: number,
): Promise<SearchAnalyticsSummary> {
  const numericDays = Number.isFinite(days) && days > 0 ? days : 7;
  const clampedDays =
    numericDays > MAX_ANALYTICS_DAYS ? MAX_ANALYTICS_DAYS : numericDays;

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const since = new Date(now.getTime() - clampedDays * msPerDay);

  let logs: SearchLog[] = [];
  try {
    logs = await prisma.searchLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
  } catch (dbError) {
    console.error("[getSearchAnalyticsSummary] DB query failed:", dbError);
    // Return empty summary on DB error rather than throwing
    return emptyAnalyticsSummary(clampedDays, since, now);
  }

  // Handle null/undefined logs array defensively
  if (!Array.isArray(logs) || logs.length === 0) {
    return emptyAnalyticsSummary(clampedDays, since, now);
  }

  const queryAgg = new Map<
    string,
    { count: number; sumResults: number; canonical: string }
  >();
  const zeroResultMap = new Map<string, SearchLogZeroResultQuery>();

  let totalSearches = 0;
  let totalResults = 0;

  for (const log of logs) {
    // Skip completely invalid log entries
    if (!log || typeof log !== "object") continue;

    totalSearches += 1;

    // Safely extract fields
    const rawQuery = safeString(log.query);
    const trimmed = rawQuery.trim();
    const normalizedKey = trimmed.toLowerCase() || "(empty)";
    const resultCount = safeNonNegativeInt(log.resultCount);

    totalResults += resultCount;

    const existing = queryAgg.get(normalizedKey);
    if (existing) {
      existing.count += 1;
      existing.sumResults += resultCount;
    } else {
      queryAgg.set(normalizedKey, {
        count: 1,
        sumResults: resultCount,
        canonical: trimmed || "(empty)",
      });
    }

    if (resultCount === 0) {
      const key = trimmed || "(empty)";
      const createdAt = safeDateOrNull(log.createdAt);
      const existingZero = zeroResultMap.get(key);
      if (!existingZero) {
        zeroResultMap.set(key, {
          query: key,
          timesSearched: 1,
          lastSearchedAt: createdAt,
        });
      } else {
        existingZero.timesSearched += 1;
        if (
          createdAt &&
          (!existingZero.lastSearchedAt ||
            createdAt > existingZero.lastSearchedAt)
        ) {
          existingZero.lastSearchedAt = createdAt;
        }
      }
    }
  }

  const uniqueQueries = queryAgg.size;
  const avgResultCount =
    totalSearches > 0 ? totalResults / totalSearches : null;

  const topQueries: SearchLogTopQuery[] = Array.from(queryAgg.values())
    .map(({ canonical, count, sumResults }) => ({
      query: canonical,
      count,
      avgResultCount: count > 0 ? sumResults / count : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  const zeroResultQueries: SearchLogZeroResultQuery[] = Array.from(
    zeroResultMap.values(),
  )
    .sort((a, b) => b.timesSearched - a.timesSearched)
    .slice(0, 50);

  return {
    ok: true,
    range: { days: clampedDays, since, until: now },
    totals: {
      totalSearches,
      uniqueQueries,
      avgResultCount,
    },
    topQueries,
    zeroResultQueries,
  };
}
