// src/lib/providers/index.ts
import type { ProductProvider, ProviderId } from "./types";
import { staticProvider } from "./staticProvider";
import { dummyJsonProvider } from "./dummyJsonProvider";
import { realStoreProvider } from "./realStoreProvider";
import { providerConfigs } from "@/config/providerConfig";

const providerMap: Record<ProviderId, ProductProvider> = {
  static: staticProvider,
  dummyjson: dummyJsonProvider,
  realstore: realStoreProvider,
};

/**
 * Get the list of enabled providers at runtime.
 * This function re-evaluates the providerConfigs each time it's called,
 * ensuring environment variables are properly loaded.
 */
export function getEnabledProviders(): ProductProvider[] {
  const enabledConfigs = providerConfigs.filter((cfg) => cfg.enabled);
  const enabledProviders = enabledConfigs
    .map((cfg) => providerMap[cfg.id])
    .filter((p): p is ProductProvider => p != null);

  // Always log provider resolution for transparency
  console.log(
    "[providers] getEnabledProviders() called. Enabled:",
    enabledProviders.map((p) => p.name),
    "| Config flags:",
    providerConfigs.map((c) => `${c.id}=${c.enabled}`)
  );

  return enabledProviders;
}

/**
 * Static export for backwards compatibility.
 * NOTE: This is computed at module load time and may not reflect
 * runtime env changes. Prefer getEnabledProviders() for runtime use.
 */
export const providers: ProductProvider[] = providerConfigs
  .filter((cfg) => cfg.enabled)
  .map((cfg) => providerMap[cfg.id])
  .filter((p): p is ProductProvider => p != null);

// Log enabled providers at startup
console.log(
  "[providers] Module loaded. Static providers array:",
  providers.map((p) => p.name),
  "| Config flags:",
  providerConfigs.map((c) => `${c.id}=${c.enabled}`)
);
