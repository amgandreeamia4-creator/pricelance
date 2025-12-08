// src/components/SearchBar.tsx
"use client";

import React from "react";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
};

export const SearchBar: React.FC<Props> = ({
  query,
  onQueryChange,
  onSearch,
  isSearching,
}) => {
  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    e
  ) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
      <div className="flex-1 rounded-full border border-[var(--pl-accent)] bg-white px-4 py-2 shadow-sm transition focus-within:border-[var(--pl-accent-strong)] focus-within:shadow-[0_0_24px_rgba(79,140,207,0.35)] dark:border-[var(--pl-accent)] dark:bg-slate-900">
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500"
          placeholder="Search products (e.g. “iphone 15”, “nescafe”, “dior sauvage”)"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button
        type="button"
        className="pl-primary-btn px-6 py-2.5 text-sm md:text-base disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onSearch}
        disabled={isSearching}
      >
        {isSearching ? "Searching..." : "Search"}
      </button>
    </div>
  );
};

// also provide default export, just in case
export default SearchBar;