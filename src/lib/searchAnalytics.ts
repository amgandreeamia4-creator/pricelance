// src/lib/searchAnalytics.ts
import type { SavedSearch } from "@prisma/client";
import { prisma } from "@/lib/db";

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
