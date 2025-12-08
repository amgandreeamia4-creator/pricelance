"use client";

import React, { useEffect, useState } from "react";

type SearchSummaryResponse = {
  ok: boolean;
  topQueries: { query: string; count: number }[];
  recentSearches: { query: string; createdAt: string }[];
};

interface SearchInsightsProps {
  onSelectQuery?: (query: string) => void;
}

async function loadSummary(): Promise<SearchSummaryResponse | null> {
  try {
    const res = await fetch("/api/search/summary");
    if (!res.ok) {
      console.error("Search summary request failed", res.status);
      return null;
    }

    const json = (await res.json()) as SearchSummaryResponse;
    return json;
  } catch (err) {
    console.error("Error loading search summary", err);
    return null;
  }
}

const SearchInsights: React.FC<SearchInsightsProps> = ({ onSelectQuery }) => {
  const [summary, setSummary] = useState<SearchSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const data = await loadSummary();
      if (!cancelled) {
        setSummary(data);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasTopQueries = summary?.topQueries && summary.topQueries.length > 0;
  const hasRecent =
    summary?.recentSearches && summary.recentSearches.length > 0;
  const isEmptySummary = !hasTopQueries && !hasRecent;

  return (
    <section aria-label="Search insights" className="text-xs">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-300">
            Search insights
          </h2>
          <p className="text-[11px] text-slate-500">
            Popular & recent queries.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-28 rounded-full bg-slate-700/70" />
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex h-5 w-16 items-center rounded-full bg-slate-800/80" />
            <span className="inline-flex h-5 w-20 items-center rounded-full bg-slate-800/80" />
            <span className="inline-flex h-5 w-24 items-center rounded-full bg-slate-800/80" />
          </div>
        </div>
      )}

      {/* Fallback when insights are unavailable */}
      {!loading && !summary && (
        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
          No search insights are available right now. Try searching for a few
          products and check back later.
        </div>
      )}

      {/* Data / empty-with-data state */}
      {!loading && summary && (
        <div className="space-y-2">
          {hasTopQueries && (
            <div>
              <h3 className="mb-1 text-[11px] font-semibold text-slate-300">
                People often search for
              </h3>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {summary.topQueries.slice(0, 8).map((item) => (
                  <button
                    key={item.query}
                    type="button"
                    onClick={
                      onSelectQuery
                        ? () => onSelectQuery(item.query)
                        : undefined
                    }
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                      "border-teal-500/30 bg-slate-900/80 text-slate-100",
                      "hover:border-teal-400/70 hover:bg-slate-900 hover:text-teal-100",
                      "transition-colors",
                      onSelectQuery ? "cursor-pointer" : "cursor-default",
                    ].join(" ")}
                  >
                    <span className="text-teal-300">#{item.query}</span>
                    {item.count > 1 && (
                      <span className="text-[10px] text-slate-400">
                        ×{item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasRecent && (
            <div>
              <h3 className="mb-1 text-[11px] font-semibold text-slate-300">
                Your recent searches
              </h3>
              <ul className="max-h-40 space-y-0.5 overflow-y-auto text-[11px] text-slate-300">
                {summary.recentSearches.slice(0, 6).map((item, idx) => {
                  const date = new Date(item.createdAt);
                  const label = isNaN(date.getTime())
                    ? ""
                    : date.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      });

                  return (
                    <li
                      key={`${item.query}-${idx}-${item.createdAt}`}
                      className="flex items-center justify-between rounded-md bg-slate-900/60 px-2 py-0.5"
                    >
                      <span className="truncate text-slate-200">
                        {item.query}
                      </span>
                      {label && (
                        <span className="ml-2 flex-shrink-0 text-[10px] text-slate-500">
                          {label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Empty summary but successful request */}
          {isEmptySummary && (
            <p className="text-[11px] text-slate-400">
              Start searching to see popular and recent queries.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default SearchInsights;
