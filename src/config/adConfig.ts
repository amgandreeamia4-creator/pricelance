const env = process.env;

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = env[name];
  if (raw == null) return defaultValue;
  const normalized = raw.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export const adConfig = {
  enabled: envFlag("NEXT_PUBLIC_ADS_ENABLED", false),

  // Google AdSense config – all optional & env-driven
  adsense: {
    clientId: env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",
    // Logical slot → env var mapping
    slots: {
      headerBanner: env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || "",
      sidebarCard: env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || "",
      resultsInline: env.NEXT_PUBLIC_ADSENSE_SLOT_RESULTS_INLINE || "",
    },
  },

  // Logical slot ids for internal usage
  slots: {
    headerBanner: "header-banner",
    sidebarCard: "sidebar-card",
    resultsInline: "results-inline",
  },
};

