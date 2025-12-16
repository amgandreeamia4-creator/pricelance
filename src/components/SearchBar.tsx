// src/components/SearchBar.tsx
"use client";

import React from "react";

type Props = {
  query?: string;
  onQueryChange?: (value: string) => void;
  onSearch?: (q: string) => void | Promise<void>;
  isSearching?: boolean;
};

export const SearchBar: React.FC<Props> = ({
  query: externalQuery,
  onQueryChange,
  onSearch,
  isSearching = false,
}) => {
  const [internalQuery, setInternalQuery] = React.useState("");
  const query = externalQuery ?? internalQuery;
  const handleChange = onQueryChange ?? setInternalQuery;

  // Press Enter to search
  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(query);
    }
  };

  return (
    <div className="w-full flex items-center gap-2">
      {/* INPUT */}
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search products…"
        className="w-full px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-700
                   text-sm text-slate-200 focus:outline-none focus:border-blue-400"
      />

      {/* BUTTON */}
      <button
        onClick={() => onSearch && onSearch(query)}
        disabled={isSearching}
        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 
                   text-sm text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSearching ? "Searching…" : "Search"}
      </button>
    </div>
  );
};

export default SearchBar;