export interface NormalizedSearchResult {
  original: string;
  normalized: string;
  isVague: boolean;
  usedAlias: string | null;
}

/**
 * Extended query info used for fallback logic.
 */
export interface NormalizedQueryInfo {
  raw: string;           // original user input
  normalized: string;    // lowercased, trimmed, spaces collapsed
  tokens: string[];      // split on spaces, no empties
}

/**
 * Simple heuristic-based detection of whether a query is "vague".
 * We consider a query vague if:
 * - It is 1–2 words AND
 * - Contains no digits AND
 * - Does not contain an obvious brand token.
 */
function isVagueQuery(tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  if (tokens.length > 3) return false; // longer phrases are more likely specific

  const hasDigit = tokens.some((t) => /\d/.test(t));
  if (hasDigit) return false;

  const brands = [
    "apple",
    "samsung",
    "sony",
    "xiaomi",
    "huawei",
    "dell",
    "hp",
    "lenovo",
    "asus",
    "acer",
    "lg",
    "bosch",
    "philips",
    "nike",
    "adidas",
    "dior",
    "chanel",
    "lancome",
  ];

  const lowerTokens = tokens.map((t) => t.toLowerCase());
  const hasBrand = lowerTokens.some((t) => brands.includes(t));
  if (hasBrand) return false;

  return true;
}

/**
 * Apply alias mapping for vague or generic terms.
 */
function applyAliases(raw: string): { normalized: string; usedAlias: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { normalized: "", usedAlias: null };
  }

  const lower = trimmed.toLowerCase();

  const directAliases: Record<string, string> = {
    phone: "smartphone",
    phones: "smartphones",
    mobile: "smartphone",
    mobiles: "smartphones",
    tv: "television",
    tvs: "televisions",
    laptop: "laptop",
    laptops: "laptop",
    perfume: "perfume",
    perfumes: "perfume",
    fragrance: "perfume",
    fragrances: "perfume",
    skincare: "skincare",
    cream: "face cream",
    creams: "face cream",
    grocery: "groceries",
    groceries: "groceries",
    headphones: "headphones",
    earphones: "earbuds",
    earbuds: "earbuds",
    shoes: "shoes",
    sneakers: "sneakers",
    coffee: "coffee",
    chocolate: "chocolate",
  };

  if (directAliases[lower]) {
    return {
      normalized: directAliases[lower],
      usedAlias: directAliases[lower],
    };
  }

  // For multi-word queries, we can optionally tweak some generic tokens.
  // For now, keep it simple and just return as-is.
  return { normalized: trimmed, usedAlias: null };
}

/**
 * Normalize an incoming search query:
 * - Trim whitespace
 * - Apply generic aliases for very vague terms
 * - Classify as "vague" vs "specific"
 */
export function normalizeSearchQuery(raw: string): NormalizedSearchResult {
  const original = raw ?? "";
  const trimmed = original.trim();

  if (!trimmed) {
    return {
      original,
      normalized: "",
      isVague: true,
      usedAlias: null,
    };
  }

  const { normalized, usedAlias } = applyAliases(trimmed);
  const tokens = normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const vague = isVagueQuery(tokens);

  return {
    original,
    normalized,
    isVague: vague,
    usedAlias,
  };
}

/**
 * Normalize a user query for fallback processing.
 * - Trims whitespace
 * - Collapses multiple spaces
 * - Lowercases
 * - Splits into tokens
 */
export function normalizeUserQuery(input: string): NormalizedQueryInfo {
  const raw = input ?? "";
  const normalized = raw.trim().replace(/\s+/g, " ").toLowerCase();
  const tokens = normalized.length > 0 ? normalized.split(" ") : [];
  return { raw, normalized, tokens };
}

/**
 * Build broader fallback queries from a normalized query.
 * These are tried in order if the primary query returns 0 results.
 * 
 * Strategies:
 * 1. Drop trailing number (e.g., "samsung z flip 7" -> "samsung z flip")
 * 2. Drop trailing word if 3+ tokens (e.g., "samsung galaxy s24 ultra" -> "samsung galaxy s24")
 * 3. Use first 2 tokens if 3+ tokens (e.g., "samsung galaxy s24" -> "samsung galaxy")
 */
export function buildFallbackQueries(nq: NormalizedQueryInfo): string[] {
  const { normalized, tokens } = nq;
  const fallbacks: string[] = [];

  // Strategy 1: Drop trailing number
  // e.g., "samsung z flip 7" -> "samsung z flip"
  const droppedTrailingNumber = normalized.replace(/\s+\d+$/, "").trim();
  if (droppedTrailingNumber !== normalized && droppedTrailingNumber.length > 0) {
    fallbacks.push(droppedTrailingNumber);
  }

  // Strategy 2: Drop last token if 3+ tokens
  // e.g., "samsung galaxy s24 ultra" -> "samsung galaxy s24"
  if (tokens.length >= 3) {
    const droppedLastToken = tokens.slice(0, -1).join(" ");
    if (!fallbacks.includes(droppedLastToken)) {
      fallbacks.push(droppedLastToken);
    }
  }

  // Strategy 3: Use first 2 tokens if 3+ tokens
  // e.g., "samsung galaxy s24" -> "samsung galaxy"
  if (tokens.length >= 3) {
    const firstTwo = tokens.slice(0, 2).join(" ");
    if (!fallbacks.includes(firstTwo)) {
      fallbacks.push(firstTwo);
    }
  }

  // Strategy 4: Use just the first token if 2+ tokens
  // e.g., "samsung galaxy" -> "samsung"
  if (tokens.length >= 2) {
    const firstToken = tokens[0];
    if (!fallbacks.includes(firstToken)) {
      fallbacks.push(firstToken);
    }
  }

  return fallbacks;
}
