// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import ThemeProvider from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import MainHeader from "@/components/MainHeader";
import AcceptCookiesButton, {
  AnalyticsScriptGate,
} from "@/components/AcceptCookiesButton";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || "";
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || "";
const PROFITSHARE_ID = process.env.NEXT_PUBLIC_PROFITSHARE_ID?.trim() || "";

export const metadata: Metadata = {
  title: "PriceLance – Smart Tech Price Comparison",
  description:
    "Search and compare prices for tech products across multiple retailers in one place.",
  metadataBase: new URL("https://pricelance.com"),
  openGraph: {
    title: "PriceLance – Smart Tech Price Comparison",
    description:
      "Search and compare prices for tech products across multiple retailers in one place.",
    url: "https://pricelance.com",
    type: "website",
    siteName: "PriceLance",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
  },
  other: PROFITSHARE_ID
    ? {
        profitshareid: PROFITSHARE_ID,
      }
    : {},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = new Date().getFullYear();
  const skimlinksSrc = process.env.NEXT_PUBLIC_SKIMLINKS_SCRIPT_SRC;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased selection:bg-blue-600/40 selection:text-white">
        {ADSENSE_CLIENT_ID && (
          <Script
            id="adsense-global"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <ThemeProvider>
          <LanguageProvider>
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-neutral-950">
              <MainHeader />

              <main className="flex-1 w-full">
                <div className="w-[85%] max-w-none mx-auto px-4 py-6">
                  {children}
                </div>
              </main>

              <footer className="w-full border-t border-slate-400/80 dark:border-slate-800 bg-white/80 dark:bg-neutral-950/80">
                <div className="max-w-5xl mx-auto px-4 py-4 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400 space-y-1 text-center sm:text-left">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span>PriceLance · independent price comparison tool</span>
                    <span className="max-w-xl">
                      Prices and offers may vary. Some links may be affiliate
                      links, and PriceLance may earn commissions at no additional
                      cost to you.
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-500 dark:text-gray-500 sm:justify-start">
                    <a href="/legal/privacy" className="hover:text-blue-600">
                      Privacy Policy
                    </a>
                    <span>·</span>
                    <a href="/legal/terms" className="hover:text-blue-600">
                      Terms &amp; Conditions
                    </a>
                    <span>·</span>
                    <a href="/contact" className="hover:text-blue-600">
                      Contact
                    </a>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500">
                    &copy; {currentYear} PriceLance.
                  </p>
                </div>
              </footer>
            </div>
            <AcceptCookiesButton />
          </LanguageProvider>
        </ThemeProvider>
        <AnalyticsScriptGate measurementId={GA_MEASUREMENT_ID} />
        {skimlinksSrc && (
          <Script src={skimlinksSrc} strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
