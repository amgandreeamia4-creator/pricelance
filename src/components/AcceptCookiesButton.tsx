"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "pricelance-cookie-consent";

export function AcceptCookiesButton() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted") {
      setHasConsent(true);
    } else {
      setHasConsent(false);
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    }
    setHasConsent(true);
    setOpen(false);
  };

  // Header button is always visible as "Cookies"
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-full bg-[var(--pl-primary)] hover:brightness-110 text-[12px] font-medium text-white shadow-[0_0_20px_var(--pl-primary-glow)] transition-all"
      >
        Cookies
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 text-slate-50 shadow-xl">
            <h2 className="text-lg font-semibold">
              Cookies
            </h2>

            <p className="mt-3 text-sm text-slate-200">
              We use cookies to enhance your experience and analyze site usage. By continuing to use this site, you agree to our use of cookies.
            </p>

            <p className="mt-3 text-xs text-slate-400">
              This is a placeholder notice. In a real implementation, this would link to your privacy policy.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-medium border border-slate-600"
              >
                Close
              </button>

              {hasConsent !== true && (
                <button
                  type="button"
                  onClick={handleAccept}
                  className="rounded-full px-4 py-2 text-sm font-semibold bg-white text-slate-900 shadow-lg"
                >
                  Accept
                </button>
              )}
            </div>

            {hasConsent === true && (
              <p className="mt-3 text-[11px] text-slate-500">
                You have already accepted cookies.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
