"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export const STORAGE_KEY = "pricelance:cookie-consent";

export function getCookieConsentState(): "accepted" | "dismissed" | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "dismissed") {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

export function AnalyticsScriptGate({ measurementId }: { measurementId: string }) {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    setHasConsent(getCookieConsentState() === "accepted");
  }, []);

  if (!measurementId || !hasConsent) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

export default function AcceptCookiesButton() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const shouldShow = stored !== "accepted" && stored !== "dismissed";

      setIsVisible(shouldShow);
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, "accepted");
      } catch {
        // Ignore storage failures and keep the banner hidden for this session.
      }
    }
    setIsVisible(false);
  };

  const handleClose = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, "dismissed");
      } catch {
        // Ignore storage failures and keep the banner hidden for this session.
      }
    }
    setIsVisible(false);
  };

  if (!isVisible) {
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
