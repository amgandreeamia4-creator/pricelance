/**
 * Guards to prevent certain listings from being inserted into the database
 */

/**
 * Checks if a store name or URL should be blocked (e.g., eMAG listings)
 * @param storeName - The name of the store
 * @param url - The product URL
 * @returns true if the listing should be blocked, false otherwise
 */
export function isBlockedStoreOrUrl(storeName?: string | null, url?: string | null): boolean {
  // Normalize both to lower-case strings (empty if undefined/null)
  const normalizedStoreName = (storeName || '').toLowerCase();
  const normalizedUrl = (url || '').toLowerCase();
  
  // Block if store name includes "emag" OR url includes "emag.ro"
  return normalizedStoreName.includes('emag') || normalizedUrl.includes('emag.ro');
}
