"use client";

import React, { useState } from "react";

interface ChatAssistantProps {
  location?: any;
  onClose?: () => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ location, onClose }) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [hasAsked, setHasAsked] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;

    setIsLoading(true);
    setError(null);
    setHasAsked(true);

    try {
      const res = await fetch("/api/assistant/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: message,
          location: location ?? null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string; summary?: string }
          | null;
        setError(data?.error || "Something went wrong asking the assistant.");
        return;
      }

      const data = (await res.json()) as { summary?: string };
      if (!data.summary) {
        setError("The assistant did not return a summary.");
        return;
      }

      setAnswer(data.summary);
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
        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200 leading-relaxed">
          {answer}
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






