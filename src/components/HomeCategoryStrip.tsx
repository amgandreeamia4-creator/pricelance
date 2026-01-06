// src/components/HomeCategoryStrip.tsx
"use client";

import React from "react";
import { HOME_CATEGORIES } from "@/config/homeCategories";

export type HomeCategoryStripProps = {
  onSelectCategory?: (term: string) => void;
};

export default function HomeCategoryStrip({
  onSelectCategory,
}: HomeCategoryStripProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {HOME_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() =>
            onSelectCategory?.(cat.searchQuery ?? cat.label)
          }
          className="
            px-4 py-2
            rounded-2xl
            bg-[var(--pl-card)]
            border border-[var(--pl-card-border)]
            shadow-[0_0_15px_var(--pl-primary-glow)]
            text-[12px] font-medium text-[var(--pl-text)]
            hover:-translate-y-[1px]
            hover:shadow-[0_0_18px_var(--pl-primary-glow)]
            transition-all
          "
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
