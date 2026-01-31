"use client";

import Link from "next/link";

export default function MainHeader() {
  return (
    <header className="w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          PriceLance
        </Link>
        <nav className="flex items-center gap-4 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Link
            href="/"
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            About
          </Link>
          <Link
            href="/legal/terms"
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            Terms
          </Link>
          <Link
            href="/legal/privacy"
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            Privacy
          </Link>
          <Link
            href="/contact"
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
