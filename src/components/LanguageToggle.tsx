"use client";

import { useLanguage } from "./LanguageProvider";
import { useState, useEffect } from "react";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Show default state that matches server render
    return (
      <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-1 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-neutral-900/80 dark:text-slate-200">
        <button
          type="button"
          className="px-2 py-0.5 rounded-full transition bg-blue-600 text-white"
        >
          EN
        </button>
        <button
          type="button"
          className="px-2 py-0.5 rounded-full transition text-slate-700 dark:text-slate-300"
        >
          RO
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-1 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-neutral-900/80 dark:text-slate-200">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-2 py-0.5 rounded-full transition ${
          lang === "en"
            ? "bg-blue-600 text-white"
            : "text-slate-700 dark:text-slate-300"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("ro")}
        className={`px-2 py-0.5 rounded-full transition ${
          lang === "ro"
            ? "bg-blue-600 text-white"
            : "text-slate-700 dark:text-slate-300"
        }`}
      >
        RO
      </button>
    </div>
  );
}
