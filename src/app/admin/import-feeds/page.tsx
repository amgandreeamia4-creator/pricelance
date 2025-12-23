// src/app/admin/import-feeds/page.tsx
"use client";

import React, { useState } from "react";

type ImportSummary = {
  productsCreated: number;
  productsMatched: number;
  listingsCreated: number;
  listingsUpdated: number;
  errors: { rowNumber: number; message: string }[];
  /** Count of rows that upserted a Product but did not create a Listing */
  productOnlyRows: number;
  /** Count of rows that created/updated a Listing */
  listingRows: number;
};

type FeedConfig = {
  id: string;
  name: string;
  url: string;
};

const FEEDS: FeedConfig[] = [
  {
    id: "monitors-sheet",
    name: "Monitors – Google Sheets CSV",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLgeEPnApyYsZuXia6tzM0wmy3geEV7PsAUq6PtBLYCFa9PWUGbCHi52GszCBQOYk0KEh11UUjVPII/pub?gid=0&single=true&output=csv",
  },
  {
    id: "phones-sheet",
    name: "Phones – Google Sheets CSV",
    url: "https://example.com/phones.csv",
  },
];

type FeedState = {
  loading: boolean;
  summary?: ImportSummary;
  error?: string;
};

export default function ImportFeedsPage() {
  const [feedStates, setFeedStates] = useState<Record<string, FeedState>>({});

  async function handleRunImport(feed: FeedConfig) {
    setFeedStates((prev) => ({
      ...prev,
      [feed.id]: { ...prev[feed.id], loading: true, error: undefined },
    }));

    try {
      const res = await fetch("/api/admin/import-from-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: feed.url }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage =
          typeof data.error === "string"
            ? data.error
            : `Import failed with status ${res.status}`;

        setFeedStates((prev) => ({
          ...prev,
          [feed.id]: {
            loading: false,
            summary: undefined,
            error: errorMessage,
          },
        }));
        return;
      }

      setFeedStates((prev) => ({
        ...prev,
        [feed.id]: {
          loading: false,
          summary: data.summary as ImportSummary,
          error: undefined,
        },
      }));
    } catch (err) {
      console.error("[admin/import-feeds] Network error:", err);
      setFeedStates((prev) => ({
        ...prev,
        [feed.id]: {
          loading: false,
          summary: undefined,
          error: "Network error - could not connect to server",
        },
      }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Import Feeds</h1>
          <a
            href="/admin/import-csv"
            className="text-sm px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            CSV Upload →
          </a>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Run imports from predefined CSV feed URLs (e.g. Google Sheets published as CSV).
        </p>

        <div className="space-y-4">
          {FEEDS.map((feed) => {
            const state = feedStates[feed.id] || { loading: false };

            return (
              <div
                key={feed.id}
                className="p-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold mb-1">{feed.name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 break-all">
                      URL: {feed.url}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunImport(feed)}
                    disabled={state.loading}
                    className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.loading ? "Running..." : "Run import"}
                  </button>
                </div>

                {/* Last result */}
                <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3 text-xs">
                  <div className="font-medium mb-1">Last result:</div>

                  {state.error && (
                    <p className="text-red-600 dark:text-red-400 mb-1">{state.error}</p>
                  )}

                  {state.summary ? (
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Products created
                        </div>
                        <div className="text-sm font-semibold">
                          {state.summary.productsCreated}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Products matched
                        </div>
                        <div className="text-sm font-semibold">
                          {state.summary.productsMatched}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Listings created
                        </div>
                        <div className="text-sm font-semibold">
                          {state.summary.listingsCreated}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Listings updated
                        </div>
                        <div className="text-sm font-semibold">
                          {state.summary.listingsUpdated}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Rows with listings
                        </div>
                        <div className="text-sm font-semibold">
                          {state.summary.listingRows ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Product-only rows
                        </div>
                        <div className="text-sm font-semibold">
                          {state.summary.productOnlyRows ?? 0}
                        </div>
                      </div>
                    </div>
                  ) : !state.error ? (
                    <p className="text-slate-500 dark:text-slate-400">
                      No runs yet.
                    </p>
                  ) : null}

                  {state.summary && state.summary.errors.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Errors: {state.summary.errors.length}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
