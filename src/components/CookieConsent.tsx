"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pricelance_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden md:flex items-center gap-3">
      <button
        type="button"
        onClick={accept}
        className="px-4 py-2 rounded-full bg-[var(--pl-primary)] hover:brightness-110 text-[12px] font-medium text-white shadow-[0_0_20px_var(--pl-primary-glow)] transition-all"
      >
        Accept Cookies
      </button>
    </div>
  );
}
