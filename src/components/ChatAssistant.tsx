"use client";

import React, { useState } from "react";

type AssistantDeal = {
  productId: string;
  productName: string;
  storeName: string;
  url: string | null;
  price: number;
  currency: string;
};

type AssistantResponse = {
  ok: boolean;
  query: string;
  summary?: string;
  bestDeal: AssistantDeal | null;
  alternatives: AssistantDeal[];
  products?: any[];
  locationIntent?: boolean;
  error?: string;
  brand?: string | null;
  category?: string | null;
  dealMode?: boolean;
  status?: "ok" | "ok-db-only" | "no-results" | "error";
  providerStatus?: {
    realstore?: "ok" | "error" | "disabled";
    catalog?: "ok" | "error" | "disabled";
  };
};

interface ChatAssistantProps {
  location?: any;
  onClose?: () => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ location, onClose }) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [bestDeal, setBestDeal] = useState<AssistantDeal | null>(null);
  const [alternatives, setAlternatives] = useState<AssistantDeal[]>([]);
  const [hasAsked, setHasAsked] = useState(false);
  const [dealMode, setDealMode] = useState(false);
  const [status, setStatus] = useState<AssistantResponse["status"]>(undefined);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;

    setIsLoading(true);
    setError(null);
    setHasAsked(true);
    setAnswer(null);
    setBestDeal(null);
    setAlternatives([]);
    setDealMode(false);
    setStatus(undefined);

    try {
      const res = await fetch("/api/assistant/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          countryCode: location?.country ?? undefined,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | AssistantResponse
        | null;

      if (!res.ok || !data) {
        setError(
          data?.error || "Something went wrong asking the assistant."
        );
        return;
      }

      if (!data.ok) {
        setError(data.error || "Assistant returned an error.");
        return;
      }

      setStatus(data.status);

      if (data.status === "no-results") {
        setAnswer(
          data.summary ||
            `I couldn’t find any products for "${data.query}" in our catalog yet.`,
        );
      } else if (data.status === "error") {
        setError(
          data.summary ||
            "Something went wrong while checking prices. Please try again in a moment.",
        );
        return;
      } else {
        if (!data.summary) {
          setError("The assistant did not return a summary.");
          return;
        }
        setAnswer(data.summary);
      }
      setBestDeal(data.bestDeal ?? null);
      setAlternatives(Array.isArray(data.alternatives) ? data.alternatives : []);
      setDealMode(Boolean(data.dealMode));
    } catch (err) {
      console.error("[ChatAssistant] Error talking to assistant:", err);
      setError("Network error while talking to the assistant.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-teal-400/60 bg-slate-900/80 p-4 shadow-[0_0_25px_rgba(45,212,191,0.35)] text-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-teal-400/70 bg-teal-500/20 text-xs font-semibold text-teal-200">
            AI
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-teal-100">Assistant</span>
            <span className="text-xs text-teal-200/80">
              Ask about products, prices, or what to buy next.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-teal-200/80">
            {isLoading ? "Thinking…" : hasAsked ? "Ready" : "Try asking"}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
              aria-label="Close assistant"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about these prices, stores, or delivery times…"
          className="flex-1 rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-xl bg-teal-500/90 px-3 py-2 text-xs font-semibold text-slate-950 shadow hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isLoading ? "Thinking…" : "Ask"}
        </button>
      </form>

      {error && (
        <div className="mb-2 text-[11px] text-red-400">{error}</div>
      )}

      {answer ? (
        <div className="mt-2 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200 leading-relaxed">
            {answer}
          </div>

          {bestDeal && (
            <div className="rounded-xl border border-teal-600/60 bg-slate-950/80 p-3 text-xs text-slate-100">
              <div className="mb-1 text-[11px] font-semibold uppercase text-teal-300">
                {dealMode ? "Hottest offer" : "Best price found"}
              </div>
              <div className="text-xs font-medium">
                {bestDeal.productName || "Unnamed product"}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-300">
                {bestDeal.price.toFixed(2)} {bestDeal.currency} at {bestDeal.storeName}
              </div>
              {bestDeal.url && (
                <a
                  href={bestDeal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex text-[11px] text-teal-300 hover:underline"
                >
                  View offer
                </a>
              )}
            </div>
          )}

          {alternatives.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-[11px] text-slate-200 space-y-1">
              <div className="font-semibold uppercase text-slate-400">
                Other options
              </div>
              <ul className="space-y-1">
                {alternatives.map((alt) => (
                  <li key={`${alt.productId}-${alt.storeName}-${alt.price}`}>
                    <span className="font-medium">{alt.productName || "Unnamed product"}</span>{" "}
                    – {alt.price.toFixed(2)} {alt.currency} at {alt.storeName}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-300/80">
          The assistant will read your question and return a short summary to help
          you interpret prices, offers, and delivery options.
        </p>
      )}
    </div>
  );
};

export default ChatAssistant;






