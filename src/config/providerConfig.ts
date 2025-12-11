// src/config/providerConfig.ts
import type { ProviderConfig } from "@/lib/providers/types";

const env = process.env;

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = env[name];
  if (raw == null) return defaultValue;
  const normalized = raw.toLowerCase();
  const result = normalized === "1" || normalized === "true" || normalized === "yes";

  // Dev-only logging to debug env flag evaluation
  if (process.env.NODE_ENV !== "production") {
    console.log(`[providerConfig] envFlag("${name}") raw="${raw}" → ${result}`);
  }

  return result;
}

export const providerConfigs: ProviderConfig[] = [
  {
    id: "static",
    name: "Static Catalog",
    // Enabled by default for local/dev so demo data is always available
    enabled: envFlag("PROVIDER_STATIC_ENABLED", true),
  },
  {
    id: "dummyjson",
    name: "DummyJSON Demo",
    enabled: envFlag("PROVIDER_DUMMYJSON_ENABLED", false),
    baseUrl: env.DUMMYJSON_BASE_URL || "https://dummyjson.com",
  },
  {
    id: "catalog",
    name: "Curated Catalog",
    enabled: true,
  },
  {
    id: "realstore",
    name: "Real-Time Product Search (Aggregator)",
    // Disabled by default in local/dev; can be turned on via env flag
    enabled: envFlag("PROVIDER_REALSTORE_ENABLED", false),

    baseUrl:
      env.REALTIME_PRODUCT_SEARCH_BASE_URL ||
      "https://real-time-product-search.p.rapidapi.com",
    apiKeyEnvVar: "REALTIME_PRODUCT_SEARCH_API_KEY",
    // Increased from 8000 to 20000 - Node.js fetch can be slower than native HTTP clients
    timeoutMs: 20000,
  },
];

// Dev-only: log final provider configs at module load
if (process.env.NODE_ENV !== "production") {
  console.log(
    "[providerConfig] Module loaded. Provider configs:",
    providerConfigs.map((c) => ({ id: c.id, enabled: c.enabled }))
  );

  console.log("[providerConfig] Effective flags:", {
    static: envFlag("PROVIDER_STATIC_ENABLED", true),
    dummyjson: envFlag("PROVIDER_DUMMYJSON_ENABLED", false),
    realstore: envFlag("PROVIDER_REALSTORE_ENABLED", false),
  });
}