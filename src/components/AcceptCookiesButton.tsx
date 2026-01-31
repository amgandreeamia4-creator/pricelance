"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pricelance:cookie-consent";

export default function AcceptCookiesButton() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEY);

    // Show only if user hasn't accepted yet
    if (!stored) {
      setIsVisible(true);
    }

    setIsMounted(true);
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    }
    setIsVisible(false);
  };

  // Close without storing anything → it will show again on next reload
  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] md:bottom-auto md:top-[110px] md:right-[32px]">
      <div className="max-w-xs flex items-start gap-3 rounded-2xl bg-[var(--pl-card)] border border-[var(--pl-card-border)] shadow-lg px-4 py-3 text-[11px] text-[var(--pl-text)]">
        <div className="flex-1">
          <p className="font-semibold mb-1 text-[var(--pl-text)]">
            Cookies on PriceLance
          </p>
          <p className="text-[11px] leading-snug text-[var(--pl-text-subtle)]">
            We use cookies for basic analytics and to improve the site. By
            continuing, you accept this.
          </p>
          <button
            type="button"
            onClick={handleAccept}
            className="mt-2 inline-flex items-center rounded-full bg-[var(--pl-primary)] text-white text-[11px] font-semibold px-3 py-1.5 shadow hover:brightness-110 transition"
          >
            Accept
          </button>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close cookie message"
          className="ml-1 text-[var(--pl-text-subtle)] hover:text-[var(--pl-text)] text-sm leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
