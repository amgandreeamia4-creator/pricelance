"use client";

import React from "react";

const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

export function AdSidebarBox() {
  if (!adsEnabled) {
    return (
      <div className="pl-card px-3 py-3 text-xs text-slate-400">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] text-slate-400 ring-1 ring-slate-600/80">
              Ad
            </span>
            Sidebar ad preview
          </span>
          <span className="text-[10px] text-slate-500">300x250 / 300x600</span>
        </div>
        <div className="mt-2 flex h-32 max-h-80 items-center justify-center overflow-y-auto rounded-xl border border-dashed border-slate-700/80 bg-slate-950/90 text-[10px] text-slate-500">
          Future ad space
        </div>
      </div>
    );
  }

  // When you enable AdSense, replace this with the real ad slot markup.
  return (
    <div className="pl-card px-3 py-3">
      <div className="max-h-80 w-full overflow-y-auto">
        {/* TODO: real sidebar AdSense unit */}
        <div className="flex h-64 items-center justify-center text-xs text-slate-500">
          Ad content area
        </div>
      </div>
    </div>
  );
}
