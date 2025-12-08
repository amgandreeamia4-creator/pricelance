// src/components/LocationSelector.tsx
"use client";

import React from "react";

type SearchLocation = {
  country?: string;
  region?: string;
  city?: string;
};

type Props = {
  location: SearchLocation | null;
  onLocationChange: (value: SearchLocation | null) => void;
  onUseMyLocation: () => void;
};

export const LocationSelector: React.FC<Props> = ({
  location,
  onLocationChange,
  onUseMyLocation,
}) => {
  const countryValue = location?.country ?? "";

  return (
    <div className="pl-card flex flex-col gap-3 px-4 py-3 text-xs text-slate-700 md:w-64 dark:text-slate-100">
      <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Your location
      </div>
      <select
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm transition focus:outline-none focus:ring-1 focus:ring-[rgb(var(--pl-primary))] focus:border-[rgb(var(--pl-primary))] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        value={countryValue}
        onChange={(e) => {
          const value = e.target.value;
          if (!value) {
            onLocationChange(null);
          } else {
            onLocationChange({ country: value });
          }
        }}
      >
        <option value="">Not set</option>
        <option value="RO">Romania (RO)</option>
        <option value="DE">Germany (DE)</option>
        <option value="US">United States (US)</option>
      </select>
      <button
        type="button"
        className="pl-primary-btn mt-1 w-full justify-center text-sm"
        onClick={onUseMyLocation}
      >
        Use my location (stub)
      </button>
    </div>
  );
};

export default LocationSelector;