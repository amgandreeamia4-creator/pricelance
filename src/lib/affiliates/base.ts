import type { AffiliateAdapter, NormalizedListing } from "./types";

export abstract class BaseAffiliateAdapter implements AffiliateAdapter {
  abstract id: string;
  abstract name: string;

  abstract normalize(raw: string): NormalizedListing[];
}

export function parseBooleanLike(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value !== "string") return undefined;

  const lower = value.trim().toLowerCase();
  if (!lower) return undefined;

  if (["true", "1", "yes", "y"].includes(lower)) return true;
  if (["false", "0", "no", "n"].includes(lower)) return false;

  return undefined;
}

export function parseNumberLike(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(",", ".");
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}
