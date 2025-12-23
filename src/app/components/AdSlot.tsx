"use client";

import React, { useEffect, useRef } from "react";
import { adConfig } from "@/config/adConfig";

export type AdSlotId = keyof typeof adConfig.slots;

export interface AdSlotProps {
  /** Logical slot key, e.g. "headerBanner", "sidebarCard", "resultsInline". */
  slot: AdSlotId;
  /** Optional label for debugging / transparency, default is "Sponsored". */
  label?: string;
  /** Optional additional className to fine-tune layout. */
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  slot,
  label = "Sponsored",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const enabled = adConfig.enabled;
  const clientId = adConfig.adsense.clientId;
  const slotId = adConfig.adsense.slots[slot];
  const canRenderAdsense = enabled && !!clientId && !!slotId;

  useEffect(() => {
    if (!canRenderAdsense) return;

    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // Fail silently; the placeholder is not shown in this mode.
      console.warn("[AdSlot] adsbygoogle push failed:", err);
    }
  }, [canRenderAdsense, slotId]);

  // If ads are globally disabled, render nothing.
  if (!enabled) {
    return null;
  }

  if (canRenderAdsense) {
    // Real AdSense slot
    return (
      <div
        ref={containerRef}
        className={[
          "relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/80",
          "px-2 py-2",
          className,
        ].join(" ")}
      >
        <div className="mb-1 flex items-center justify-between gap-2 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-300">
            {label}
          </span>
          <span className="text-[10px] text-slate-500">Ad</span>
        </div>
        <ins
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Fallback placeholder when AdSense is not configured
  return (
    <div
      data-ad-slot={slot}
      className={[
        "relative overflow-hidden rounded-2xl border border-teal-500/30 bg-slate-900/80",
        "shadow-md shadow-teal-500/20",
        "px-4 py-3",
        className,
      ].join(" ")}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-300">
          {label}
        </span>
        <span className="text-[10px] text-slate-500">Ad placeholder</span>
      </div>
      <div className="h-16 w-full animate-pulse rounded-xl bg-slate-800/80 sm:h-20" />
    </div>
  );
};
