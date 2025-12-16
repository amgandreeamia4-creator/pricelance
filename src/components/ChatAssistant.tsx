"use client";

import React, { FormEvent, useState } from "react";

type Listing = {
  price?: number | string | null;
  storeName?: string | null;
  store?: string | null;
  shippingDays?: number | null;
};

type Product = {
  id?: string | number;
  name?: string | null;
  brand?: string | null;
  category?: string | null;
  listings?: Listing[];
};

type ChatAssistantProps = {
  products: Product[];
  searchQuery: string;
  location?: string;
};

export default function ChatAssistant({
  products,
  searchQuery,
  location,
}: ChatAssistantProps) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasResults = Array.isArray(products) && products.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !hasResults) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: input.trim(),
          searchQuery,
          location,
          products,
        }),
      });

      if (!res.ok) {
        throw new Error("Assistant request failed");
      }

      const data = await res.json();
      setAnswer(data.answer ?? "I couldn't generate a summary this time.");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ?? "Something went wrong while talking to the assistant."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const disabledMessage = !hasResults
    ? "Run a search first so I can look at real prices."
    : "";

  return (
    <div className="rounded-2xl border border-[var(--pl-card-border)] bg-[var(--pl-card)] p-4 shadow-sm ring-1 ring-teal-400/40 dark:ring-teal-500/40">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-1.5">
            Assistant
          </h3>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            Ask about products, prices, or what to buy next.
          </p>
        </div>
        <span className="mt-0.5 rounded-full border border-[var(--pl-card-border)] bg-[var(--pl-bg)] px-2 py-1 text-[10px] text-slate-600 dark:text-slate-300">
          Try asking
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative mb-3">
        <input
          className="w-full rounded-full border border-[var(--pl-card-border)] bg-[var(--pl-bg)] px-3 py-2 pr-14 text-xs text-slate-700 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:text-slate-100 dark:focus:border-teal-300 dark:focus:ring-teal-500/40"
          placeholder={
            hasResults
              ? "Ask about these prices, stores, or which option is best..."
              : "Search for something first, then ask me about the results..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || !hasResults}
        />
        <button
          type="submit"
          disabled={isLoading || !hasResults || !input.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-[var(--pl-primary)] px-3 py-1 text-xs font-medium text-white shadow-md transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "..." : "Ask"}
        </button>
      </form>

      {!hasResults && (
        <p className="mb-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {disabledMessage}
        </p>
      )}

      {error && (
        <p className="mb-2 text-xs leading-relaxed text-red-500 dark:text-red-400">
          {error}
        </p>
      )}

      {answer ? (
        <div className="mt-2 rounded-2xl bg-[var(--pl-bg)] p-3 text-xs leading-relaxed text-slate-700 shadow-sm dark:text-slate-100">
          {answer.split("\n").map((line, idx) => (
            <p key={idx} className="mb-[2px] last:mb-0">
              {line}
            </p>
          ))}
        </div>
      ) : (
        hasResults && (
          <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            Example: "Which option looks best for fast delivery?" or "Is there a clear
            cheapest option here?"
          </p>
        )
      )}
    </div>
  );
}






