"use client";

import React from "react";

type Props = {
  query: string;
  disabled?: boolean;
  onSave: () => void;
};

export default function SaveSearchButton({ query, disabled, onSave }: Props) {
  return (
    <button
      onClick={onSave}
      disabled={disabled || !query.trim()}
      className="w-full text-[12px] px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 
                 disabled:opacity-50 disabled:cursor-not-allowed transition text-white font-medium"
    >
      Save this search
    </button>
  );
}
