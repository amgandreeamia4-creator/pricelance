// src/components/LocationSelector.tsx
"use client";
import React from "react";

// Restored classic UI layout from old PriceLance design (Screenshot #2)
export default function LocationSelector({
  location,
  onLocationChange,
  onUseLocation,
}: {
  location: string;
  onLocationChange: (value: string) => void;
  onUseLocation?: () => void;
}) {
  return (
    <div className="p-4 border border-slate-700 bg-[#0B1220] rounded-md shadow-sm">
      <p className="text-[11px] font-semibold text-slate-300 tracking-wide uppercase mb-2">
        Your Location
      </p>

      <select
        className="w-full px-3 py-2 text-[12px] bg-[#111827] border border-slate-600 rounded focus:outline-none focus:border-blue-400"
        value={location}
        onChange={(e) => onLocationChange(e.target.value)}
      >
        <option>Not set</option>
        <option>Romania</option>
        <option>United States</option>
        <option>Germany</option>
        <option>United Kingdom</option>
      </select>

      <button
        onClick={onUseLocation}
        className="mt-3 w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-[12px] text-white font-medium"
      >
        Use my location
      </button>
    </div>
  );
}