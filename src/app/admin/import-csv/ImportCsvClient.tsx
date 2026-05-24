"use client";

import React, { useState, useEffect } from "react";
import { AFFILIATE_INGEST_PROVIDERS, type AffiliateIngestProviderId } from '@/config/affiliateIngestion.client';

// SIMPLE TEST: This should appear when the component loads
console.log("[ImportCsvClient] Component loaded!");

type MerchantFeed = {
  id: string;
  name: string;
  merchant: {
    storeName: string;
  };
};

type ImportStatus = "idle" | "uploading" | "success" | "partial-success" | "failed";

type ImportState = {
  status: ImportStatus;
  message: string | null;
  rawResponse: any | null;
};

export default function ImportCsvClient() {
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<AffiliateIngestProviderId>('profitshare');
  const [merchantFeedId, setMerchantFeedId] = useState<string>("");
  const [availableFeeds, setAvailableFeeds] = useState<MerchantFeed[]>([]);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  
  const [state, setState] = useState<ImportState>({
    status: "idle",
    message: null,
    rawResponse: null,
  });

  const [errorsCollapsed, setErrorsCollapsed] = useState(true);

  useEffect(() => {
    fetchFeeds();
  }, []);

  async function fetchFeeds() {
    setIsLoadingFeeds(true);
    try {
      const res = await fetch("/api/admin/merchant-feeds", {
        headers: {
          "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
      });
      const data = await res.json();
      if (data.ok) {
        setAvailableFeeds(data.feeds);
      }
    } catch (err) {
      console.error("Failed to fetch merchant feeds:", err);
    } finally {
      setIsLoadingFeeds(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("[ImportCsvClient] handleSubmit called!");
    console.log("[ImportCsvClient] File:", file);
    console.log("[ImportCsvClient] Provider:", provider);
    console.log("[ImportCsvClient] Merchant Feed ID:", merchantFeedId);

    if (!file) {
      setState({
        status: "failed",
        message: "Please choose a CSV file first.",
        rawResponse: null,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider", provider);
    if (merchantFeedId) {
      formData.append("merchantFeedId", merchantFeedId);
    }

    console.log("[ImportCsvClient] FormData created:", Object.fromEntries(formData.entries()));

    setState({
      status: "uploading",
      message: "Import in progress...",
      rawResponse: null,
    });

    try {
      console.log("[ImportCsvClient] Starting fetch to /api/admin/import-csv");
      
      const res = await fetch("/api/admin/import-csv", {
        method: "POST",
        body: formData,
        headers: {
          // IMPORTANT: this must match validateAdminToken()
          "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "",
        },
      });

      console.log("[ImportCsvClient] Fetch response received:", res);
      console.log("[ImportCsvClient] Response status:", res.status);
      console.log("[ImportCsvClient] Response ok:", res.ok);

      const json = await res.json().catch(() => null);
      
      console.log("[ImportCsvClient] Parsed JSON:", json);

      // Determine success / partial / failed according to backend summary
      const createdListings = Number(json?.createdListings || 0);
      const failedRows = Number(json?.failedRows || 0);
      const okFlag = Boolean(json?.ok);

      const isSuccess = okFlag === true && failedRows === 0;
      const isPartial = okFlag === false || failedRows > 0;

      const nextStatus: ImportStatus = isSuccess
        ? "success"
        : createdListings > 0
        ? "partial-success"
        : "failed";

      let nextMessage = json?.message || "";
      if (nextStatus === "success") nextMessage = "Import completed successfully.";
      if (nextStatus === "partial-success") nextMessage = "Import completed with errors.";
      if (nextStatus === "failed") nextMessage = "Import failed — no listings were created.";

      console.log("[ImportCsvClient] Import completed with status:", nextStatus, { createdListings, failedRows, okFlag });

      setState({
        status: nextStatus,
        message: nextMessage,
        rawResponse: json,
      });
    } catch (err) {
      console.error("Import failed:", err);
      setState({
        status: "failed",
        message: "Import failed: network or server error.",
        rawResponse: null,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {state.status !== "idle" && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            state.status === "failed"
              ? "border-red-200 bg-red-50 text-red-700"
              : state.status === "partial-success"
              ? "border-yellow-200 bg-yellow-50 text-yellow-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {state.message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[var(--pl-card-border)] bg-[var(--pl-card)] p-5 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--pl-text-subtle)] mb-2">
            Upload Affiliate CSV
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const next = e.target.files?.[0] ?? null;
              setFile(next);
            }}
            className="block w-full text-sm text-[var(--pl-text)] file:mr-3 file:rounded-xl file:border file:border-[var(--pl-card-border)] file:bg-[var(--pl-bg)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--pl-text)] hover:file:border-[var(--pl-primary)] hover:file:text-[var(--pl-primary)]"
          />
          {file && (
            <p className="mt-1 text-[11px] text-[var(--pl-text-subtle)]">
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <div className="space-y-1 mb-4">
            {AFFILIATE_INGEST_PROVIDERS.map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="provider"
                  value={p.id}
                  checked={provider === p.id}
                  onChange={() => setProvider(p.id)}
                />
                <span>{p.label}</span>
                {p.description && (
                  <span className="text-xs text-gray-500">— {p.description}</span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--pl-text-subtle)] mb-2">
            Merchant Feed (Optional)
          </label>
          <select
            value={merchantFeedId}
            onChange={(e) => setMerchantFeedId(e.target.value)}
            disabled={isLoadingFeeds}
            className="w-full rounded-xl border border-[var(--pl-card-border)] bg-[var(--pl-bg)] px-3 py-2 text-sm text-[var(--pl-text)] focus:border-[var(--pl-primary)] focus:outline-none"
          >
            <option value="">No merchant feed (standard import)</option>
            {availableFeeds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.merchant.storeName} — {f.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-slate-500">
            If selected, imported listings will be linked to this merchant and feed.
          </p>
        </div>

        <button
          type="submit"
          disabled={!file || state.status === "uploading"}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--pl-primary)] px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_var(--pl-primary-glow)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "uploading" ? "Importing..." : "Import CSV"}
        </button>
      </form>

      {/* Summary + Errors */}
      {state.rawResponse && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <strong>Import summary</strong>
            <div className="mt-2 text-xs text-slate-700 space-y-1">
              <div>Total rows: {state.rawResponse.totalRows ?? "-"}</div>
              <div>Processed: {state.rawResponse.processedRows ?? "-"}</div>
              <div>Created listings: {state.rawResponse.createdListings ?? 0}</div>
              <div>Failed rows: {state.rawResponse.failedRows ?? 0}</div>
            </div>
          </div>

          {/* Errors panel (first 10 only) */}
          {Array.isArray(state.rawResponse.errors) && state.rawResponse.errors.length > 0 && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <strong>Errors (first {Math.min(10, state.rawResponse.errors.length)})</strong>
                <button
                  className="text-xs text-slate-600 underline"
                  onClick={() => setErrorsCollapsed((s) => !s)}
                >
                  {errorsCollapsed ? "Show" : "Hide"}
                </button>
              </div>

              {!errorsCollapsed && (
                <div className="mt-3 space-y-3 text-xs text-slate-800">
                  {state.rawResponse.errors.slice(0, 10).map((err: any) => (
                    <div key={String(err.rowIndex) + String(err.reason)} className="rounded-md border border-yellow-100 bg-yellow-25 p-3">
                      <div className="text-sm font-medium">Row {err.rowIndex}</div>
                      <div className="mt-1 text-xs text-slate-600">{err.reason}</div>
                      <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-slate-950/95 p-2 text-[11px] text-slate-100">
{JSON.stringify(err.rawRow ?? err, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Raw JSON dump for deeper debugging */}
          <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-900/95 p-3 text-[11px] text-slate-100">
{JSON.stringify(state.rawResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}