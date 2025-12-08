// src/components/ResultControls.tsx
"use client";

import React from "react";

type SortBy = "default" | "price" | "delivery";

type Props = {
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
  storeFilter: string;
  onStoreFilterChange: (value: string) => void;
  fastOnly: boolean;
  onFastOnlyChange: (value: boolean) => void;
  // meta is optional; we keep it for future use but don't rely on it
  meta?: any;
};

const STORE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All stores" },
  // You can adjust these to match real store names in your data
  { value: "emag", label: "eMAG" },
  { value: "pc-garage", label: "PC Garage" },
  { value: "altex", label: "Altex" },
  { value: "amazon", label: "Amazon" },
];

const ResultControls: React.FC<Props> = ({
  sortBy,
  onSortByChange,
  storeFilter,
  onStoreFilterChange,
  fastOnly,
  onFastOnlyChange,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* Sort + Store selects */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Sort
            </span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--pl-accent)] focus:border-[var(--pl-accent)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortBy)}
            >
              <option value="default">Default</option>
              <option value="price">Price</option>
              <option value="delivery">Delivery time</option>
            </select>
          </div>

          {/* Store */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Store
            </span>
            <select
              className="min-w-[130px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--pl-accent)] focus:border-[var(--pl-accent)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              value={storeFilter}
              onChange={(e) => onStoreFilterChange(e.target.value)}
            >
              {STORE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fast shipping toggle */}
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
          <label className="inline-flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300 text-[var(--pl-accent)] focus:ring-[var(--pl-accent)] dark:border-slate-600 dark:bg-slate-900 dark:text-[var(--pl-accent)]"
              checked={fastOnly}
              onChange={(e) => onFastOnlyChange(e.target.checked)}
            />
            <span>Fast shipping only</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ResultControls;