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
      <div className="flex h-[90px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 text-xs text-slate-400">
        Header banner · Google ad preview (IDs not set)
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
