"use client";

import { useEffect, type CSSProperties } from "react";
import Script from "next/script";

export interface GoogleAdSlotProps {
  slot?: string;
  format?: "horizontal" | "vertical" | "rectangle" | "auto";
  style?: CSSProperties;
  className?: string;
}

const ADS_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-xxxxxxxxxxxxxxxx";

export function GoogleAdSlot({
  slot = process.env.NEXT_PUBLIC_ADSENSE_HEADER_SLOT || "0000000000",
  format = "horizontal",
  style,
  className = "",
}: GoogleAdSlotProps) {
  const hasRealConfig =
    !!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID &&
    !!process.env.NEXT_PUBLIC_ADSENSE_HEADER_SLOT;

  useEffect(() => {
    if (!hasRealConfig) return;
    try {
      // adsbygoogle is injected by AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("[GoogleAdSlot] adsbygoogle push failed:", e);
    }
  }, [hasRealConfig]);

  // Fallback preview when AdSense IDs are not set (dev / staging)
  if (!hasRealConfig) {
    return (
      <div className="w-full flex justify-center mb-6">
        <div className="rounded-3xl border border-slate-200 bg-white h-32 flex items-center justify-center px-8 py-4 max-w-4xl">
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">
              Compare tech prices online – laptops, phones &amp; more
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              PriceLance is an informational service that compares tech prices
              from multiple online retailers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        id="adsbygoogle-script"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
        async
        strategy="afterInteractive"
      />

      <ins
        className={`adsbygoogle block h-[90px] w-full ${className}`}
        style={{ display: "block", ...style }}
        data-ad-client={ADS_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </>
  );
}
