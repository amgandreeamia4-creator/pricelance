// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { appConfig } from "@/config/appConfig";
import { AdSenseScriptLoader } from "./components/AdSenseScriptLoader";
import { ThemeProvider } from "./providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
  metadataBase: new URL(appConfig.baseUrl),
  openGraph: {
    title: appConfig.name,
    description: appConfig.description,
    url: appConfig.baseUrl,
    siteName: appConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: appConfig.name,
    description: appConfig.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50 font-sans">
        <ThemeProvider>
          <AdSenseScriptLoader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}