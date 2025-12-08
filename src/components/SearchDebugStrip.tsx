"use client";

import React from "react";

interface ProviderCall {
  name: string;
  ingestedCount: number;
  error?: string;
  errorType?: string;
}

interface SearchDebugStripProps {
  enrichment?: {
    totalBefore?: number;
    totalAfter?: number;
    providerCalls?: ProviderCall[];
    dataStatus?: string;
    hadTimeout?: boolean;
    hadError?: boolean;
  } | null;
}

const debugEnabled =
  process.env.NEXT_PUBLIC_DEBUG_SEARCH_PROVIDERS === "true" &&
  process.env.NODE_ENV !== "production";

export function SearchDebugStrip({ enrichment }: SearchDebugStripProps) {
  if (!debugEnabled) return null;

  if (!enrichment) {
    return (
      <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
        Debug: no enrichment data for last search.
      </div>
    );
  }

  const providerCalls = enrichment.providerCalls ?? [];

  return (
    <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium text-slate-800 dark:text-slate-100">
          Search providers (dev only)
        </span>
        <span className="text-[9px] text-slate-500 dark:text-slate-400">
          totalBefore: {enrichment.totalBefore ?? "?"} · totalAfter:{" "}
          {enrichment.totalAfter ?? "?"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {providerCalls.length === 0 ? (
          <span className="text-slate-500 dark:text-slate-400">
            No providers called.
          </span>
        ) : (
          providerCalls.map((p) => (
            <span
              key={p.name}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] ${
                p.error
                  ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              }`}
            >
              {p.name}: {p.error ? `ERROR (${p.errorType ?? "unknown"})` : p.ingestedCount}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
