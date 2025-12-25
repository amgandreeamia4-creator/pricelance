"use client";

import React, { useState, useRef } from "react";

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

export default function ImportCsvClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setSummary(null);
    setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a CSV file");
      return;
    }

    setIsUploading(true);
    setSummary(null);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/import-csv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Import failed");
        return;
      }

      setSummary(data.summary);
      // Clear file input on success
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Import error:", err);
      setErrorMsg("Network error - could not connect to server");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">CSV Import</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Bulk import products and listings from a CSV file.
        </p>

        {/* Upload Form */}
        <div className="mb-6 p-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-4">Upload CSV</h2>
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
                className="block w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  file:cursor-pointer"
              />
              {file && (
                <p className="mt-2 text-xs text-slate-500">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Importing..." : "Import CSV"}
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
        {summary && (
          <div className="p-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
            <h2 className="text-lg font-semibold mb-4">Import Results</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.productsCreated}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Products created
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.productsMatched}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Products matched
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.listingsCreated}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Listings created
                </div>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summary.listingsUpdated}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Listings updated
                </div>
              </div>
            </div>

            {/* Row type breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {summary.listingRows ?? 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Rows with listings
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-slate-600 dark:text-slate-300">
                  {summary.productOnlyRows ?? 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Product-only rows
                </div>
              </div>
            </div>

            {/* Errors */}
            {summary.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                  Errors ({summary.errors.length})
                </h3>
                <div className="max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-lg p-2 space-y-1">
                  {summary.errors.map((err, i) => (
                    <div key={i} className="text-xs text-red-600 dark:text-red-400">
                      <span className="font-medium">Row {err.rowNumber}:</span> {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.errors.length === 0 && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Import completed with no errors
              </p>
            )}
          </div>
        )}

        {/* CSV Format Reference */}
        <div className="mt-6 p-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-3">CSV Format</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            The CSV must have a header row with these columns:
          </p>
          <div className="text-xs font-mono bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto">
            product_title,brand,category,gtin,store_id,store_name,listing_url,price,currency,delivery_days,fast_delivery,in_stock
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p><strong>Product fields (required):</strong> product_title, brand (or category)</p>
            <p><strong>Listing fields:</strong> store_id, store_name, listing_url, price, currency</p>
            <p><strong>Optional:</strong> gtin, delivery_days, fast_delivery (true/false), in_stock (true/false), country_code</p>
          </div>
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
            <strong>Product-only rows:</strong> Rows with product_title + brand but missing listing_url or price will create a Product without a Listing.
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
