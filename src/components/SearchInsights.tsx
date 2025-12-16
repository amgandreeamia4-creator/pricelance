"use client";

import React from "react";

export interface Props {
  onSelectQuery?: (q: string) => void;
}

function SearchInsights({ onSelectQuery }: Props) {
  const topQueries = ["iphone 15", "laptop", "air fryer", "smartwatch"];
  const recent = ["nike shoes", "coffee beans", "wireless headphones"];

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-[11px] space-y-3">
      
      {/* TOP QUERIES */}
      <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        Top searches
      </h3>

      <div className="flex flex-wrap gap-1.5">
        {topQueries.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelectQuery?.(q)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* RECENT SEARCHES */}
      <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide pt-1">
        Recent
      </h3>

      <ul className="space-y-1">
        {recent.map((q, i) => (
          <li
            key={i}
            onClick={() => onSelectQuery?.(q)}
            className="cursor-pointer hover:bg-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300 transition"
          >
            {q}
          </li>
        ))}
      </ul>

    </section>
  );
}

export default SearchInsights;