"use client";

import React, { useState, useRef } from "react";

type ImportStatus = "idle" | "uploading" | "processing" | "done" | "error";

type ImportResult = {
  ok: boolean;
  totalRows: number;
  processedRows: number;
  createdProducts: number;
  updatedProducts: number;
  createdListings: number;
  updatedListings: number;
  skippedMissingFields: number;
  errors?: { row: number; message: string }[];
  error?: string;
};

export default function ImportCsvClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setResult(null);
    setErrorMsg(null);
    setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a CSV file");
      return;
    }

    setStatus("uploading");
    setResult(null);
    setErrorMsg(null);

    try {
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
      if (!adminToken) {
        setStatus("error");
        setErrorMsg("Admin token is not configured on the client.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      setStatus("processing");

      const res = await fetch("/api/admin/import-csv", {
        method: "POST",
        headers: {
          "x-admin-token": adminToken,
        },
        body: formData,
      });

      const data: ImportResult = await res.json();

      if (!res.ok || data.ok === false) {
        setStatus("error");
        setErrorMsg(data.error || "Import failed");
        return;
      }

      setStatus("done");
      setResult(data);
      // Clear file input on success
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Import error:", err);
      setStatus("error");
      setErrorMsg("Network error - could not connect to server");
    }
  }

  function getStatusText(): string {
    switch (status) {
      case "idle":
        return "Ready to import";
      case "uploading":
        return "Uploading file...";
      case "processing":
        return "Processing CSV...";
      case "done":
        return "Import completed";
      case "error":
        return "Import failed";
      default:
        return "";
    }
  }

  function getStatusColor(): string {
    switch (status) {
      case "idle":
        return "text-slate-500";
      case "uploading":
      case "processing":
        return "text-blue-500";
      case "done":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "text-slate-500";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">CSV Import</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Bulk import products and listings from a CSV file.
        </p>

        {/* Status Indicator */}
        <div className="mb-4 p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Status:</span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {(status === "uploading" || status === "processing") && (
              <span className="animate-pulse">●</span>
            )}
          </div>
        </div>

        {/* Upload Form */}
        <div className="mb-6 p-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-4">Upload Profitshare CSV</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2">
                CSV File <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={status === "uploading" || status === "processing"}
                className="block w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  file:cursor-pointer
                  disabled:opacity-50"
              />
              {file && (
                <p className="mt-2 text-xs text-slate-500">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || status === "uploading" || status === "processing"}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "uploading" || status === "processing" ? "Importing..." : "Import CSV"}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-4 border border-red-300 dark:border-red-700 rounded-2xl bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
          </div>
        )}

        {/* Import Summary */}
        {result && result.ok && (
          <div className="p-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
            <h2 className="text-lg font-semibold mb-4">Import Results</h2>

            {/* Overview stats */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                  {result.totalRows}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Total rows
                </div>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                  {result.processedRows}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Processed
                </div>
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {result.skippedMissingFields}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Skipped
                </div>
              </div>
            </div>

            {/* Products and Listings breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.createdProducts}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Products created
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.updatedProducts}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Products updated
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.createdListings}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Listings created
                </div>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {result.updatedListings}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Listings updated
                </div>
              </div>
            </div>

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                  Errors ({result.errors.length})
                </h3>
                <div className="max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-lg p-2 space-y-1">
                  {result.errors.map((err: { row: number; message: string }, i: number) => (
                    <div key={i} className="text-xs text-red-600 dark:text-red-400">
                      <span className="font-medium">Row {err.row}:</span> {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!result.errors || result.errors.length === 0) && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Import completed with no errors
              </p>
            )}
          </div>
        )}

        {/* CSV Format Reference - Updated for Profitshare */}
        <div className="mt-6 p-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-3">Profitshare CSV Format</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Upload a CSV exported from Profitshare.ro. The importer will automatically detect columns.
          </p>
          <div className="text-xs font-mono bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto">
            product_name,product_url,affiliate_link,image_url,price,currency,category,sku,availability
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p><strong>Required:</strong> name, price, and (product_url OR affiliate_link)</p>
            <p><strong>Optional:</strong> image_url, category, sku, currency (defaults to RON), availability</p>
          </div>
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Store name is automatically extracted from the product URL domain.
          </div>
        </div>

        {/* Link back to manual products */}
        <div className="mt-6 text-center">
          <a
            href="/admin/manual-products"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Manual Products
          </a>
        </div>
      </div>
    </div>
  );
}
