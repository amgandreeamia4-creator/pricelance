"use client";

import React, { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

type GoogleAdUnitProps = {
  slot: string;
  style?: React.CSSProperties;
  format?: string; // default "auto"
};

export default function GoogleAdUnit({ slot, style, format = "auto" }: GoogleAdUnitProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("[GoogleAdUnit] Error initializing AdSense:", error);
    }
  }, []);

  // In development, show placeholder
  if (process.env.NODE_ENV !== "production") {
    return (
      <div 
        className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center text-sm text-slate-500 bg-slate-50"
        style={{ ...style }}
      >
        Google Ad placeholder (slot {slot})
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", ...style }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
