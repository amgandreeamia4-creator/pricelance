"use client";

import React, { useState } from "react";
import { AFFILIATE_INGEST_PROVIDERS, type AffiliateIngestProviderId } from '@/config/affiliateIngestion';

type ImportState = {
  status: "idle" | "running" | "done" | "error";
  message: string | null;
  rawResponse: any | null;
};

export default function ImportCsvClient() {
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<AffiliateIngestProviderId>('profitshare');
  const [state, setState] = useState<ImportState>({
    status: "idle",
    message: null,
    rawResponse: null,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("[ImportCsvClient] handleSubmit called!");
    console.log("[ImportCsvClient] File:", file);
    console.log("[ImportCsvClient] Provider:", provider);

    if (!file) {
      setState({
        status: "error",
        message: "Please choose a CSV file first.",
        rawResponse: null,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider", provider);

    console.log("[ImportCsvClient] FormData created:", Object.fromEntries(formData.entries()));

    setState({
      status: "running",
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
          "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "",
        },
      });

      console.log("[ImportCsvClient] Fetch response received:", res);
      console.log("[ImportCsvClient] Response status:", res.status);
      console.log("[ImportCsvClient] Response ok:", res.ok);

      const json = await res.json().catch(() => null);
      
      console.log("[ImportCsvClient] Parsed JSON:", json);

      if (!res.ok || !json?.ok) {
        console.log("[ImportCsvClient] Import failed - res.ok:", res.ok, "json.ok:", json?.ok);
        setState({
          status: "error",
          message:
            json?.error || json?.message || `Import failed (HTTP ${res.status})`,
          rawResponse: json,
        });
        return;
      }

      console.log("[ImportCsvClient] Import succeeded!");
      setState({
        status: "done",
        message: json.message || "Import completed successfully.",
        rawResponse: json,
      });
    } catch (err) {
      console.error("Import failed:", err);
      setState({
        status: "error",
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
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
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

        <button
          type="submit"
          disabled={!file || state.status === "running"}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--pl-primary)] px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_var(--pl-primary-glow)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "running" ? "Importing..." : "Import CSV"}
        </button>
      </form>

      {/* Debug JSON output */}
      {state.rawResponse && (
        <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950/95 p-3 text-[11px] text-slate-100">
{JSON.stringify(state.rawResponse, null, 2)}
        </pre>
      )}
    </div>
  );
}