// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: 'PriceLance – Comparare prețuri la electronice în România',
  description:
    'Caută și compară prețuri la telefoane, laptopuri, monitoare, căști și alte electronice din magazinele online din România. Găsește cele mai bune oferte rapid, într-un singur loc.',
  metadataBase: new URL('https://pricelance.com'),
  openGraph: {
    title: 'PriceLance – Comparare prețuri la electronice în România',
    description:
      'Caută și compară prețuri la telefoane, laptopuri, monitoare, căști și alte electronice din magazinele online din România.',
    url: 'https://pricelance.com',
    type: 'website',
    siteName: 'PriceLance',
  },
  robots: {
    index: true,
    follow: true,
  },
  // This creates: <meta name="profitshareid" content="...">
  other: {
    profitshareid: "ef16e2643bedf2876e19640f297c5e9a",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="ro" suppressHydrationWarning>
      <body className="min-h-screen antialiased selection:bg-blue-600/40 selection:text-white">
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-neutral-950">
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
                </nav>
              </div>
            </header>

            <main className="flex-1 w-full">
              <div className="w-[85%] max-w-none mx-auto px-4 py-6">
                {children}
              </div>
            </main>

            <footer className="w-full border-t border-slate-400/80 dark:border-slate-800 bg-white/80 dark:bg-neutral-950/80">
              <div className="max-w-5xl mx-auto px-4 py-4 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400 space-y-1 text-center sm:text-left">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>PriceLance · instrument independent de comparare prețuri</span>
                  <span className="max-w-xl">
                    Prețurile și ofertele afișate pot varia. Unele linkuri pot fi linkuri de afiliere, iar PriceLance poate primi
                    comisioane fără costuri suplimentare pentru tine.
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-500">
                  &copy; {currentYear} PriceLance.
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}