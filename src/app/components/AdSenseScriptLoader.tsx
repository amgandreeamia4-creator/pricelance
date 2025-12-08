"use client";

import React, { useEffect } from "react";
import Script from "next/script";
import { adConfig } from "@/config/adConfig";

export const AdSenseScriptLoader: React.FC = () => {
  const clientId = adConfig.adsense.clientId;
  const enabled = adConfig.enabled && !!clientId;

  // If ads or client id are not configured, do nothing.
  if (!enabled) {
    return null;
  }

  // After the script loads, AdSense ads need a 'push' call.
  // Individual AdSlot components will also handle pushing, but having
  // a global push here is safe.
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // silently ignore
    }
  }, []);

  return (
    <Script
      id="adsense-script"
      strategy="afterInteractive"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        clientId
      )}`}
    />
  );
};
