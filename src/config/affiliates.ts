// src/config/affiliates.ts
// =============================================================================
// AFFILIATE NETWORK CONFIGURATION
// =============================================================================
//
// Central configuration for affiliate network visibility and filtering.
// Use these flags to temporarily disable specific networks from user-facing
// parts of the application while keeping data in the database for later use.
//
// This approach ensures:
// - No data loss during temporary deactivations
// - Quick toggle capability for business decisions
// - Admin views can still inspect all data for debugging
// - Clean separation between data persistence and UI visibility
// =============================================================================

/**
 * Affiliate network visibility flags.
 * Set to true to HIDE the network from public-facing features.
 * Set to false to SHOW the network normally.
 */
export const AFFILIATE_FLAGS = {
  /** Hide Profitshare listings from public search, product pages, and deals */
  DISABLE_PROFITSHARE: true,

  // Future flags can be added here:
  // DISABLE_TWOPERFORMANT: false,
  // DISABLE_AWIN: false,
  // DISABLE_IMPACT: false,
} as const;

/**
 * Admin-only flag to control visibility of disabled affiliate networks in admin UI.
 * This does NOT affect public API filtering - only admin UI components.
 * Default: false (disabled networks hidden in admin UI)
 */
export const ADMIN_SHOW_DISABLED_NETWORKS = false;

/**
 * Helper function to determine if a listing should be shown in admin UI.
 * 
 * @param listingNetworkIsDisabled - Whether the listing's network is disabled (from isListingFromDisabledNetwork)
 * @param adminOverride - Whether admin has chosen to show disabled networks
 * @returns true if the listing should be shown in admin UI
 */
export function shouldShowListingInAdmin(
  listingNetworkIsDisabled: boolean,
  adminOverride: boolean
): boolean {
  // Show if network is not disabled, OR if admin override is enabled
  return !listingNetworkIsDisabled || adminOverride;
}

/**
 * Helper function to check if a listing should be hidden from public view.
 * Uses affiliateProvider and affiliateProgram fields instead of network.
 * @param listing - The listing object to check
 * @returns true if the listing should be hidden
 */
export function shouldHideListing(listing: { affiliateProvider?: string | null; affiliateProgram?: string | null }): boolean {
  const provider = listing.affiliateProvider?.toUpperCase();
  const program = listing.affiliateProgram?.toUpperCase();
  
  // Hide Profitshare listings
  if (provider === 'PROFITSHARE' || program?.includes('PROFITSHARE')) {
    return AFFILIATE_FLAGS.DISABLE_PROFITSHARE;
  }
  
  return false;
}

/**
 * Helper function to filter out hidden networks from database queries.
 * Returns a Prisma where clause that excludes disabled networks.
 * Uses affiliateProvider and affiliateProgram fields instead of network.
 */
export function getNetworkFilter(): Record<string, any> {
  const conditions = [];

  if (AFFILIATE_FLAGS.DISABLE_PROFITSHARE) {
    conditions.push({ 
      AND: [
        { NOT: { affiliateProvider: 'PROFITSHARE' } },
        { NOT: { affiliateProgram: { contains: 'PROFITSHARE' } } }
      ]
    });
  }

  // Add future network conditions here

  if (conditions.length === 0) {
    return {}; // No filtering needed
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  // Multiple conditions - combine with AND
  return { AND: conditions };
}
