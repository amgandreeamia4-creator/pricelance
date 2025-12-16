"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--pl-card-border)] bg-[var(--pl-card)] text-[10px] text-[var(--pl-text-muted)]">
        …
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--pl-card-border)] bg-[var(--pl-card)] text-[10px] text-[var(--pl-text-muted)] hover:text-[var(--pl-text)] hover:border-blue-500/50 transition-all"
    >
      <span>{isDark ? "☀" : "🌙"}</span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}