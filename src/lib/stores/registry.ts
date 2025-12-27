// src/lib/stores/registry.ts
// Lightweight in-memory registry for known stores.
// TODO: In a future version, replace this with a proper Store table
// and join listings by storeId instead of hard-coding metadata here.

export type StoreId =
  | "emag"
  | "altex"
  | "pcgarage"
  | "flanco"
  | "amazon_de"
  | "other_eu";

export type StoreMeta = {
  id: StoreId;
  name: string;
  defaultCountryCode: string;
  domains: string[];
  logoUrl?: string;
};

const STORE_REGISTRY: Record<StoreId, StoreMeta> = {
  emag: {
    id: "emag",
    name: "eMAG",
    defaultCountryCode: "RO",
    domains: ["emag.ro"],
    logoUrl: "https://www.emag.ro/favicon.ico",
  },
  altex: {
    id: "altex",
    name: "Altex",
    defaultCountryCode: "RO",
    domains: ["altex.ro"],
    logoUrl: "https://www.altex.ro/favicon.ico",
  },
  pcgarage: {
    id: "pcgarage",
    name: "PC Garage",
    defaultCountryCode: "RO",
    domains: ["pcgarage.ro"],
    logoUrl: "https://www.pcgarage.ro/favicon.ico",
  },
  flanco: {
    id: "flanco",
    name: "Flanco",
    defaultCountryCode: "RO",
    domains: ["flanco.ro"],
    logoUrl: "https://www.flanco.ro/favicon.ico",
  },
  amazon_de: {
    id: "amazon_de",
    name: "Amazon.de",
    defaultCountryCode: "DE",
    domains: ["amazon.de"],
    logoUrl: "https://www.amazon.de/favicon.ico",
  },
  other_eu: {
    id: "other_eu",
    name: "Other EU Store",
    defaultCountryCode: "RO",
    domains: [],
  },
};

export function getStoreMeta(storeId: string): StoreMeta | null {
  const key = storeId.trim().toLowerCase() as StoreId;
  return (STORE_REGISTRY as Partial<Record<StoreId, StoreMeta>>)[key] ?? null;
}

export function normalizeStoreName(storeId: string, fallbackName: string): string {
  const meta = getStoreMeta(storeId);
  if (meta?.name) return meta.name;
  return fallbackName;
}

export function defaultCountryForStore(
  storeId: string,
  fallback?: string | null
): string | undefined {
  const meta = getStoreMeta(storeId);
  if (meta?.defaultCountryCode) return meta.defaultCountryCode;
  if (fallback && fallback.trim()) return fallback.trim().toUpperCase();
  return undefined;
}
