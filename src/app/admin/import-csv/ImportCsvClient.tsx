"use client";

import React, { useState } from "react";
import { AFFILIATE_INGEST_PROVIDERS, type AffiliateIngestProviderId } from '@/config/affiliateIngestion.client';

type ImportStatus = "idle" | "uploading" | "success" | "partial-success" | "failed";

type ImportState = {
  status: ImportStatus;
  message: string | null;
  rawResponse: any | null;
};

export default function ImportCsvClient() {
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<AffiliateIngestProviderId>('generic');
  const [legacyIntegrationsOpen, setLegacyIntegrationsOpen] = useState(false);
  
  const [state, setState] = useState<ImportState>({
    status: "idle",
    message: null,
    rawResponse: null,
  });

  const [errorsCollapsed, setErrorsCollapsed] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("[ImportCsvClient] handleSubmit called!");
    console.log("[ImportCsvClient] File:", file);
    console.log("[ImportCsvClient] Provider:", provider);

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

      const nextStatus: ImportStatus = isSuccess
        ? "success"
        : createdListings > 0
        ? "partial-success"
        : "failed";

      let nextMessage = json?.message || json?.error || "";
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
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <a
              href="/sample_products.csv"
              download
              className="font-medium text-[var(--pl-primary)] underline underline-offset-2"
            >
              Download Sample CSV
            </a>
            <a
              href="/empty_products_template.csv"
              download
              className="font-medium text-[var(--pl-primary)] underline underline-offset-2"
            >
              Download Empty Template
            </a>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Import type</label>
          <div className="space-y-1">
            {AFFILIATE_INGEST_PROVIDERS.filter((p) => p.id === 'generic').map((p) => (
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
          <div className="mt-4 border-t border-[var(--pl-card-border)] pt-3">
            <button
              type="button"
              onClick={() => setLegacyIntegrationsOpen((open) => !open)}
              aria-expanded={legacyIntegrationsOpen}
              className="flex items-center gap-2 text-sm font-medium text-[var(--pl-text)]"
            >
              <span aria-hidden="true">{legacyIntegrationsOpen ? '▾' : '▸'}</span>
              Legacy Integrations
            </button>
            <p className="mt-1 text-xs text-[var(--pl-text-subtle)]">
              Use these only for existing Profitshare or 2Performant feed formats.
            </p>
            {legacyIntegrationsOpen && (
              <div className="mt-3 space-y-1">
                {AFFILIATE_INGEST_PROVIDERS.filter((p) => p.id !== 'generic').map((p) => (
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
                      <span className="text-xs text-gray-500">â€” {p.description}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
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
          {Array.isArray(state.rawResponse.missingColumns) && state.rawResponse.missingColumns.length > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <strong>Your CSV is missing these required columns:</strong>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {state.rawResponse.missingColumns.map((column: string) => (
                  <li key={column}>{column}</li>
                ))}
              </ul>
              <a
                href="/empty_products_template.csv"
                download
                className="mt-3 inline-block text-xs font-medium underline underline-offset-2"
              >
                Download the template CSV and try again.
              </a>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <strong>Imported</strong>
              <div className="mt-2 space-y-1 text-xs text-slate-700">
                <div>✓ Products created: {state.rawResponse.createdProducts ?? 0}</div>
                <div>✓ Products updated: {state.rawResponse.updatedProducts ?? 0}</div>
                <div>✓ Listings created: {state.rawResponse.createdListings ?? 0}</div>
                <div>✓ Listings updated: {state.rawResponse.updatedListings ?? 0}</div>
                <div>✓ Rows skipped: {state.rawResponse.skippedRows ?? state.rawResponse.skipped ?? 0}</div>
              </div>
            </div>
          )}

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
        </div>
      )}
    </div>
  );
}
