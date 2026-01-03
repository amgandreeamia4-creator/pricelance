// src/config/affiliateNetworks.ts
// =============================================================================
// AFFILIATE NETWORK DETECTION CONFIGURATION
// =============================================================================
//
// Central configuration for identifying affiliate listings from specific networks.
// This provides a clean way to recognize and filter listings from particular
// affiliate providers without depending on database schema changes.
//
// The logic uses existing string fields (affiliateProvider, affiliateProgram)
// to identify network affiliations through pattern matching.
// =============================================================================

/**
 * Configuration for recognizing listings from disabled affiliate networks.
 * Each entry defines patterns to match against existing listing fields.
 * 
 * Currently configured to disable Profitshare listings by matching:
 * - affiliateProvider containing 'profitshare'
 * - affiliateProgram containing 'profitshare'
 */
export const DISABLED_AFFILIATE_SOURCES = {
  /** Profitshare network - disable all listings from this provider */
  PROFITSHARE: {
    name: 'Profitshare',
    patterns: {
      affiliateProvider: ['profitshare'],
      affiliateProgram: ['profitshare'],
      urlIncludes: [] as string[],
    },
  },
  // ✅ 2Performant is NOT included here - will be visible in public search
} as const;

/**
 * Type definition for the listing parameter used in network detection.
 * Uses only the fields we need for pattern matching.
 */
type ListingForNetworkCheck = {
  affiliateProvider?: string | null;
  affiliateProgram?: string | null;
  url?: string | null;
};

/**
 * Helper function to check if a listing belongs to a disabled affiliate network.
 * 
 * This function uses case-insensitive pattern matching against the
 * affiliateProvider and affiliateProgram fields to identify listings from
 * networks that should be hidden from public-facing features.
 * 
 * @param listing - The listing object to check, containing affiliate metadata
 * @returns true if the listing matches any disabled network pattern
 */
export function isListingFromDisabledNetwork(
  listing: ListingForNetworkCheck
): boolean {
  const { affiliateProvider, affiliateProgram, url } = listing;
  
  // Check each disabled network configuration
  for (const networkConfig of Object.values(DISABLED_AFFILIATE_SOURCES)) {
    const { patterns } = networkConfig;
    
    // Check affiliateProvider field
    if (affiliateProvider) {
      const providerLower = affiliateProvider.toLowerCase();
      for (const pattern of patterns.affiliateProvider) {
        if (providerLower.includes(pattern.toLowerCase())) {
          return true; // Found match in affiliateProvider
        }
      }
    }
    
    // Check affiliateProgram field
    if (affiliateProgram) {
      const programLower = affiliateProgram.toLowerCase();
      for (const pattern of patterns.affiliateProgram) {
        if (programLower.includes(pattern.toLowerCase())) {
          return true; // Found match in affiliateProgram
        }
      }
    }
    
    // Check urlIncludes field (for networks like 2Performant)
    if (url && patterns.urlIncludes) {
      const urlLower = url.toLowerCase();
      for (const pattern of patterns.urlIncludes) {
        if (urlLower.includes(pattern.toLowerCase())) {
          return true; // Found match in URL
        }
      }
    }
  }
  
  return false; // No disabled network patterns matched
}

/**
 * Helper function to get the name of the disabled network that matches a listing.
 * Useful for debugging and logging purposes.
 * 
 * @param listing - The listing object to check
 * @returns The name of the matching disabled network, or null if none matched
 */
export function getDisabledNetworkName(
  listing: ListingForNetworkCheck
): string | null {
  const { affiliateProvider, affiliateProgram } = listing;
  
  for (const [networkKey, networkConfig] of Object.entries(DISABLED_AFFILIATE_SOURCES)) {
    const { patterns } = networkConfig;
    
    // Check affiliateProvider field
    if (affiliateProvider) {
      const providerLower = affiliateProvider.toLowerCase();
      for (const pattern of patterns.affiliateProvider) {
        if (providerLower.includes(pattern.toLowerCase())) {
          return networkConfig.name;
        }
      }
    }
    
    // Check affiliateProgram field
    if (affiliateProgram) {
      const programLower = affiliateProgram.toLowerCase();
      for (const pattern of patterns.affiliateProgram) {
        if (programLower.includes(pattern.toLowerCase())) {
          return networkConfig.name;
        }
      }
    }
  }
  
  return null;
}
