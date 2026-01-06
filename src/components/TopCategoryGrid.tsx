"use client";

import React from "react";
import clsx from "clsx";

type TopCategory = {
  id: string;
  label: string;
  query: string;
};

const TOP_CATEGORIES: TopCategory[] = [
  { id: "laptops", label: "Laptopuri", query: "laptop" },
  { id: "phones", label: "Telefoane", query: "telefon" },
  { id: "monitors", label: "Monitoare", query: "monitor" },
  { id: "audio", label: "Căști & Audio", query: "casti" },
  { id: "kb-mouse", label: "Tastaturi & Mouse", query: "tastatura" },
  { id: "tv-display", label: "TV & Display", query: "tv" },
  { id: "tablets", label: "Tablete", query: "tableta" },
  { id: "smartwatch", label: "Smartwatch", query: "smartwatch" },
];

type TopCategoryGridProps = {
  // Optional callback so we can plug into the existing search logic
  onCategoryClick?: (query: string) => void;
};

export default function TopCategoryGrid({ onCategoryClick }: TopCategoryGridProps) {
  const handleClick = (query: string) => {
    if (onCategoryClick) {
      onCategoryClick(query);
    }
  };

  return (
    <section className="mt-4 mb-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {TOP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleClick(cat.query)}
            className={clsx(
              "relative flex items-center justify-center",
              "rounded-2xl sm:rounded-[18px]",
              "border border-slate-200/70 dark:border-slate-800/80",
              "bg-white/90 dark:bg-neutral-900/90",
              "shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_8px_24px_rgba(15,23,42,0.8)]",
              "hover:shadow-[0_14px_40px_rgba(59,130,246,0.25)]",
              "hover:border-blue-400/80 hover:bg-blue-50/80 dark:hover:bg-sky-950/60",
              "transition-all duration-150",
              "px-4 py-3 sm:px-5 sm:py-4"
            )}
          >
            {/* Soft glow overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-[18px] bg-gradient-to-b from-sky-200/40 via-transparent to-transparent dark:from-sky-500/10" />
            <span className="relative text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
