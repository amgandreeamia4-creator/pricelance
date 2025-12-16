"use client";
import React from "react";
import { STORES } from "@/config/catalog";

// Restored old UI layout for Filters panel
export default function ResultControls({
  sortBy,
  onSortByChange,
  onSortChange,
  storeFilter,
  onStoreFilterChange,
  onStoreChange,
  fastOnly,
  onFastOnlyChange,
  disabled,
}: {
  sortBy: string;
  onSortByChange?: (v: string) => void;
  onSortChange?: (v: string) => void;
  storeFilter: string;
  onStoreFilterChange?: (v: string) => void;
  onStoreChange?: (v: string) => void;
  fastOnly: boolean;
  onFastOnlyChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="p-4 bg-[#0B1220] border border-slate-700 rounded-md shadow-sm">
      <p className="text-[11px] text-slate-300 uppercase font-semibold mb-3">
        Filters
      </p>

      <label className="text-[11px] text-slate-400 mb-1 block">Sort:</label>
      <select
        className="w-full mb-3 px-3 py-2 text-[12px] bg-[#111827] border border-slate-600 rounded"
        value={sortBy}
        onChange={(e) => (onSortByChange ?? onSortChange)?.(e.target.value)}
      >
        <option value="default">Default</option>
        <option value="priceLow">Price (Low → High)</option>
        <option value="priceHigh">Price (High → Low)</option>
      </select>

      <label className="text-[11px] text-slate-400 mb-1 block">Store:</label>
      <select
        className="w-full mb-3 px-3 py-2 text-[12px] bg-[#111827] border border-slate-600 rounded"
        value={storeFilter}
        onChange={(e) => (onStoreFilterChange ?? onStoreChange)?.(e.target.value)}
      >
        <option value="all">All stores</option>
        {STORES.map((store) => (
          <option key={store.id} value={store.id}>
            {store.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          checked={fastOnly}
          onChange={(e) => onFastOnlyChange(e.target.checked)}
        />
        <span className="text-[11px] text-slate-400">Fast delivery only</span>
      </div>
    </div>
  );
}