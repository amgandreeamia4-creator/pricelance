"use client";

import React, { useState } from "react";

// These are inlined at build time by Next.js
const DEFAULT_FEED_URL = process.env.NEXT_PUBLIC_MASTER_FEED_URL || "";
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";

type ImportStatus = "idle" | "loading" | "success" | "error";

export default function ImportFeedsClient() {
  const [feedUrl, setFeedUrl] = useState<string>(DEFAULT_FEED_URL);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<any | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!feedUrl) {
      setStatus("error");
      setMessage("Please enter a feed URL.");
      setDetails(null);
      return;
    }

    setStatus("loading");
    setMessage("Starting import…");
    setDetails(null);

    try {
      const res = await fetch("/api/admin/import-from-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Short-term: use public token so the browser can authenticate.
          // This is acceptable because /admin/* is already behind Basic Auth.
          ...(ADMIN_TOKEN ? { "x-admin-token": ADMIN_TOKEN } : {}),
        },
        body: JSON.stringify({
          url: feedUrl,
          // Mark this as a sheet-style source.
          source: "sheet",
        }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // If response isn't JSON, we still show a generic message.
      }

      if (!res.ok) {
        setStatus("error");
        setMessage(
          json?.error ||
            `Import failed with status ${res.status}${
              res.statusText ? ` (${res.statusText})` : ""
            }`,
        );
        setDetails(json);
        return;
      }

      setStatus("success");
      setMessage("Import completed successfully.");
      setDetails(json);
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Unexpected error while importing feed.");
      setDetails(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6">Feed Import (URL / Google Sheet)</h1>

      <p className="text-sm text-gray-600 mb-4">
        Use this tool to import products and listings from a remote CSV feed
        (for example, a Google Sheet exported as CSV). This runs against the
        production database.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="feedUrl"
            className="block text-sm font-medium mb-1"
          >
            Feed URL (CSV / Google Sheet export)
          </label>
          <input
            id="feedUrl"
            type="url"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/.../export?format=csv"
          />
          {DEFAULT_FEED_URL && (
            <p className="mt-1 text-xs text-gray-500">
              Default URL comes from{" "}
              <code className="font-mono">NEXT_PUBLIC_MASTER_FEED_URL</code>.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Importing…" : "Import feed"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-6 rounded-md border px-3 py-2 text-sm ${
            status === "success"
              ? "border-green-500 bg-green-50 text-green-800"
              : status === "error"
              ? "border-red-500 bg-red-50 text-red-800"
              : "border-gray-300 bg-gray-50 text-gray-800"
          }`}
        >
          {message}
        </div>
      )}

      {details && (
        <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </div>
  );
}
