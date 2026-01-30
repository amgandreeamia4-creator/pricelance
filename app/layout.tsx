// app/layout.tsx
import "../src/app/globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import ThemeProvider from "@/components/ThemeProvider";
import MainHeader from "@/components/MainHeader";

const GA_MEASUREMENT_ID = 'G-6NM0TRYT3T';

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
  verification: {
    google: 'edNnT14enMS24XUO4qN',
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
  console.log("RootLayout (app/layout.tsx) rendered");
  const currentYear = new Date().getFullYear();
  const skimlinksSrc = process.env.NEXT_PUBLIC_SKIMLINKS_SCRIPT_SRC;

  return (
    <html lang="ro" suppressHydrationWarning>
      <body className="min-h-screen antialiased selection:bg-blue-600/40 selection:text-white">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="adsense-global" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6846589122417205" crossOrigin="anonymous" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
        {process.env.NODE_ENV === "production" && (
          <Script
            id="adsense-script"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <ThemeProvider>
          <MainHeader />
          {children}
        </ThemeProvider>
        {skimlinksSrc && (
          <Script
            src={skimlinksSrc}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
