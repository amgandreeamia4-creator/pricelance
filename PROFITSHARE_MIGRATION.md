# Profitshare Data Hiding - Migration Guide

## Overview
This implementation temporarily hides Profitshare-based data from user-facing parts of the app while keeping it in the database for later use.

## Database Migration Required

After deploying these changes, run the following Prisma migration command:

```bash
npx prisma migrate dev --name add_affiliate_network_field
```

Or for production:
```bash
npx prisma migrate deploy
```

## What This Implementation Does

### 1. Database Schema Changes
- Added `AffiliateNetwork` enum with values: `TWOPERFORMANT`, `PROFITSHARE`, `DIRECT`, `OTHER`
- Added `network` field to `Listing` model to track affiliate network

### 2. Configuration System
- Created `src/config/affiliates.ts` with `DISABLE_PROFITSHARE: true` flag
- Helper functions `shouldHideNetwork()` and `getNetworkFilter()` for consistent filtering

### 3. Import Pipeline Updates
- Updated `src/lib/importService.ts` to support `network` field
- Created `src/lib/affiliates/profitshareAdapter.ts` that tags all Profitshare imports with `network: 'PROFITSHARE'`
- Created `src/app/api/admin/import-profitshare/route.ts` for Profitshare-specific imports

### 4. API Filtering
- **User-facing APIs** (`/api/products`, `/api/deals`): Filter out Profitshare listings when flag is enabled
- **Admin APIs** (`/api/admin/*`): Show all data including Profitshare (no filtering)

### 5. UI Protection
- Updated `src/components/ProductList.tsx` to disable store links for disabled networks
- Shows "Link temporarily unavailable" tooltip for disabled networks
- Applies visual styling (opacity, cursor) to indicate disabled state

## How to Re-enable Profitshare

Simply change the flag in `src/config/affiliates.ts`:

```typescript
export const AFFILIATE_FLAGS = {
  DISABLE_PROFITSHARE: false, // Change from true to false
};
```

## Files Modified

### New Files
- `src/config/affiliates.ts` - Affiliate network configuration
- `src/lib/affiliates/profitshareAdapter.ts` - Profitshare adapter
- `src/app/api/admin/import-profitshare/route.ts` - Profitshare import endpoint

### Modified Files
- `prisma/schema.prisma` - Added network field
- `src/lib/importService.ts` - Support network tagging
- `src/app/api/products/route.ts` - Filter out disabled networks
- `src/app/api/deals/route.ts` - Filter out disabled networks  
- `src/components/ProductList.tsx` - Disable links for disabled networks

## Safety Features

1. **Double Filtering**: Both database-level filtering and UI-level safety checks
2. **Admin Access**: Admin views continue to show all data for debugging
3. **No Data Loss**: Profitshare data remains in database, just hidden from users
4. **Easy Toggle**: Single flag controls visibility across the entire app

## Testing

1. Import some Profitshare data using the new `/api/admin/import-profitshare` endpoint
2. Verify it appears in admin views but not in public search/results
3. Toggle the flag to confirm data can be re-enabled
4. Test that store links are properly disabled for Profitshare listings
