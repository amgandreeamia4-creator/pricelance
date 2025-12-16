"use client";

import React from "react";

interface Props {
  query?: string;
  count?: number;
}

export default function SearchDebugStrip({ query = "", count = 0 }: Props) {
  return (
    <div className="border border-slate-800 bg-slate-900 px-3 py-2 rounded-lg mb-4 text-[11px] text-slate-300">
      <div>Debug: last query → <span className="text-teal-300">{query || "-"}</span></div>
      <div>Results returned → <span className="text-teal-300">{count}</span></div>
      <div className="text-slate-500 mt-1">
        (Real analytics will activate after Supabase integration)
      </div>
    </div>
  );
}