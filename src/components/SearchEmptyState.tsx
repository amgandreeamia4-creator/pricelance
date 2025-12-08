"use client";

import React from "react";

type DataStatus = "ok" | "partial" | "provider_timeout" | "provider_error" | "no_providers";

interface SearchEmptyStateProps {
  query: string;
  normalizedQuery?: string;
  isVague?: boolean;
  usedAlias?: string | null;
  onQuickSearch?: (value: string) => void;
  /** Data status from the API - indicates if providers failed */
  dataStatus?: DataStatus;
  /** True if any provider timed out */
  hadProviderTimeout?: boolean;
  /** True if any provider had an error */
  hadProviderError?: boolean;
}

const DEFAULT_SUGGESTIONS_VAGUE = [
  "iphone 15",
  "laptop",
  "wireless headphones",
  "coffee beans",
];

const DEFAULT_SUGGESTIONS_SPECIFIC = [
  "iphone 15 plus",
  "samsung galaxy s24",
  "sony wh-1000xm5",
];

export function SearchEmptyState(props: SearchEmptyStateProps) {
  const { 
    query, 
    normalizedQuery, 
    isVague, 
    usedAlias, 
    onQuickSearch,
    dataStatus,
    hadProviderTimeout,
    hadProviderError,
  } = props;

  const effectiveQuery = query?.trim() || normalizedQuery?.trim() || "";
  const vague = isVague ?? true;

  const suggestions = vague
    ? DEFAULT_SUGGESTIONS_VAGUE
    : DEFAULT_SUGGESTIONS_SPECIFIC;

  // Determine if this is a provider failure vs genuine no results
  const isProviderFailure = 
    dataStatus === "provider_timeout" || 
    dataStatus === "provider_error" ||
    hadProviderTimeout ||
    hadProviderError;

  // Different messaging based on what happened
  let title: string;
  let messageLines: string[];
  let icon: string;

  if (isProviderFailure) {
    // Provider failed - be honest about it
    icon = "!";
    title = hadProviderTimeout 
      ? "Our price providers are taking too long to respond"
      : "We couldn't reach our live price providers";
    messageLines = [
      "This might be a temporary network issue or the providers are busy.",
      "Please try again in a few moments.",
      "In the meantime, try a different search or check back shortly.",
    ];
  } else {
    // Genuine no results
    icon = "?";
    title = effectiveQuery
      ? `No matches for "${effectiveQuery}" right now`
      : "No matches for this search right now";
    messageLines = [
      "We couldn't find products for this search at the moment.",
      "Try a simpler name, a different brand, or another category.",
      "Right now we work best for electronics, groceries, perfume, and skincare.",
    ];
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-2">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ring-1 ${
          isProviderFailure 
            ? "bg-amber-100 text-amber-700 ring-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-700"
            : "bg-[var(--pl-accent-soft)] text-[var(--pl-accent)] ring-[var(--pl-accent-strong)]"
        }`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h3>
      </div>

      <div className="mb-3 space-y-1 text-xs text-slate-700 dark:text-slate-300">
        {messageLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {usedAlias && (
        <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
          We searched for a related term:{" "}
          <span className="rounded-full border border-[var(--pl-accent)] bg-[var(--pl-accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--pl-accent)]">
            {usedAlias}
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onQuickSearch?.(s)}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 transition hover:border-[var(--pl-accent)] hover:bg-[var(--pl-accent-soft)] hover:text-[var(--pl-accent)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[var(--pl-accent)] dark:hover:bg-slate-700 dark:hover:text-[var(--pl-accent)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
