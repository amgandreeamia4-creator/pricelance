"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

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

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatAssistantProps = {
  products: Product[];
  searchQuery: string;
  location?: string;
  disabled?: boolean;
  selectedProductId?: string | null;
  favoriteIds?: string[];
};

export default function ChatAssistant({
  products,
  searchQuery,
  location,
  disabled,
  selectedProductId,
  favoriteIds,
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasResults = Array.isArray(products) && products.length > 0;
  const isDisabled = !!disabled || !hasResults;

  const hasSelection = !!selectedProductId;
  const hasFavorites = Array.isArray(favoriteIds) && favoriteIds.length > 0;

  const descriptionText = hasSelection && hasFavorites
    ? "You can ask about the selected product, or about your favorites."
    : hasSelection
    ? "You can ask things like \"Cheapest option for this product?\"."
    : hasFavorites
    ? "You can ask things like \"Best value among my favorites?\"."
    : "Ask about the current results: cheapest options, best value, or how prices compare by store.";

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
  }, [searchQuery]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isDisabled || isLoading) return;

    const userMessage: AssistantMessage = {
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const body = {
        messages: nextMessages.slice(-8),
        products,
        query: searchQuery || undefined,
        location: location || undefined,
        selectedProductId: selectedProductId ?? undefined,
        favoriteIds: Array.isArray(favoriteIds) ? favoriteIds : undefined,
      };

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("Assistant request failed", res.status);
        setError("I couldn’t process this question right now.");
        return;
      }

      const data = await res.json();
      const ok: boolean = data?.ok ?? false;
      const answer: string | undefined = data?.answer;

      if (!ok || !answer) {
        setError("I couldn’t understand the response from the assistant.");
        return;
      }

      const assistantMessage: AssistantMessage = {
        role: "assistant",
        content: answer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Assistant error", err);
      setError("Something went wrong talking to the assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  const disabledMessage = !hasResults
    ? "Run a search first so I can look at real prices."
    : "";

  return (
    <motion.section
      id="ai-assistant"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-[var(--pl-card-border)] bg-[var(--pl-card)] p-4 shadow-sm ring-1 ring-teal-400/40 dark:ring-teal-500/40"
    >
      <div className="flex flex-col h-full">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-1.5">
              Assistant
            </h3>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {descriptionText}
            </p>
          </div>
          <span className="mt-0.5 rounded-full border border-[var(--pl-card-border)] bg-[var(--pl-bg)] px-2 py-1 text-[10px] text-slate-600 dark:text-slate-300">
            Try asking
          </span>
        </div>

        <div className="flex-1 min-h-[120px] max-h-[220px] overflow-y-auto mb-3 rounded-xl bg-[var(--pl-bg)] border border-[var(--pl-card-border)] px-3 py-2 space-y-2">
          {messages.length === 0 ? (
            <p className="text-[11px] text-[var(--pl-text-subtle)]">
              Ask about cheapest options, best value, or filter what you see in the
              results.
            </p>
          ) : (
            <>
              {messages.map((m, index) => (
                <div
                  key={index}
                  className={
                    m.role === "user"
                      ? "text-[11px] text-[var(--pl-text)] text-right"
                      : "text-[11px] text-[var(--pl-text)]"
                  }
                >
                  <span
                    className={
                      m.role === "user"
                        ? "inline-block px-2 py-1 rounded-lg bg-[var(--pl-primary)] text-white"
                        : "inline-block px-2 py-1 rounded-lg bg-[var(--pl-card)] border border-[var(--pl-card-border)]"
                    }
                  >
                    {m.content}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {!hasResults && (
          <p className="mb-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {disabledMessage}
          </p>
        )}

        {error && (
          <p className="mb-2 text-[11px] text-red-400">{error}</p>
        )}

        <div className="flex items-center gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--pl-bg)] border border-[var(--pl-card-border)] text-[11px] text-[var(--pl-text)] focus:outline-none focus:border-teal-400 disabled:opacity-50"
            placeholder={
              isDisabled
                ? "Start a search first to ask about real results."
                : "Ask a question about these results..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isDisabled || isLoading}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isDisabled || isLoading || !input.trim()}
            className="px-3 py-2 rounded-xl bg-[var(--pl-primary)] text-[11px] text-white font-medium shadow-[0_0_10px_var(--pl-primary-glow)] disabled:opacity-50"
          >
            {isLoading ? "Thinking..." : "Ask"}
          </button>
        </div>
      </div>
    </motion.section>
  );
}






