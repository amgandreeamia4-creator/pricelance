// src/lib/listingUtils.ts
// =============================================================================
// LISTING VALIDATION UTILITIES - Pre-affiliate hardening
// =============================================================================
//
// Centralized "good listing" validation logic used by:
// - /api/products (user-facing search endpoint)
// - Future affiliate adapters for pre-filtering
//
// A "good listing" is one that can be shown to end users as a valid offer.
// =============================================================================

/**
 * Checks if a URL is valid for a listing (non-null, non-empty, valid http/https).
 */
export function isValidListingUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Checks if a price is valid for a listing (finite positive number).
 */
export function isValidListingPrice(price: unknown): price is number {
  return (
    typeof price === "number" &&
    Number.isFinite(price) &&
    price > 0
  );
}

/**
 * Determines if a listing is "good" (valid URL + valid price).
 * Good listings can be shown to users; bad listings should be filtered out.
 *
 * Used by:
 * - /api/products to filter user-facing results
 * - importService to determine listing-capable rows
 * - Future affiliate adapters for validation
 */
export function isGoodListing(listing: {
  url?: string | null;
  price?: number | null;
}): boolean {
  // Only require valid price for now - allow missing URLs for browsing
  return isValidListingPrice(listing.price);
}
