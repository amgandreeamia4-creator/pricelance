// NOTE: If no providers are enabled via env, we automatically fall back
// to the static demo provider so the site always shows products.

// src/lib/providers/index.ts
import type { ProductProvider, ProviderId } from "./types";
import { staticProvider } from "./staticProvider";
import { dummyJsonProvider } from "./dummyJsonProvider";
import { realStoreProvider } from "./realStoreProvider";
import { catalogProvider } from "./catalogProvider";
import { providerConfigs } from "@/config/providerConfig";

const providerMap: Record<ProviderId, ProductProvider> = {
  static: staticProvider,
  dummyjson: dummyJsonProvider,
  realstore: realStoreProvider,
  catalog: catalogProvider,
};

/**
 * Get the list of enabled providers at runtime.
 * This function re-evaluates the providerConfigs each time it's called,
 * ensuring environment variables are properly loaded.
 */
export function getEnabledProviders(): ProductProvider[] {
  const enabledConfigs = providerConfigs.filter((cfg) => cfg.enabled);
  const providers = enabledConfigs
    .map((cfg) => providerMap[cfg.id])
    .filter((p): p is ProductProvider => p != null);

  // SAFE FALLBACK: if nothing is enabled, always fall back to static
  if (providers.length === 0) {
    console.warn(
      "[PriceLance] No product providers enabled via env – falling back to static demo provider.",
    );
    providers.push(staticProvider);
  }

  // Always log provider resolution for transparency
  console.log(
    "[providers] getEnabledProviders() called. Enabled:",
    providers.map((p) => p.name),
    "| Config flags:",
    providerConfigs.map((c) => `${c.id}=${c.enabled}`),
  );

  return providers;
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
  providerConfigs.map((c) => `${c.id}=${c.enabled}`),
);
