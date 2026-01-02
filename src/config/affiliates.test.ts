// src/config/affiliates.test.ts
// Unit tests for admin toggle functionality

import { describe, it, expect } from 'vitest';
import { shouldShowListingInAdmin } from './affiliates';
import { isListingFromDisabledNetwork } from './affiliateNetworks';

describe('Admin Toggle Functionality', () => {
  it('should show non-disabled listings regardless of admin toggle', () => {
    // Non-disabled listing should always be shown
    expect(shouldShowListingInAdmin(false, false)).toBe(true);
    expect(shouldShowListingInAdmin(false, true)).toBe(true);
  });

  it('should hide disabled listings when admin toggle is off', () => {
    // Disabled listing should be hidden when admin toggle is off
    expect(shouldShowListingInAdmin(true, false)).toBe(false);
  });

  it('should show disabled listings when admin toggle is on', () => {
    // Disabled listing should be shown when admin toggle is on
    expect(shouldShowListingInAdmin(true, true)).toBe(true);
  });

  it('should correctly identify Profitshare listings as disabled', () => {
    // Test with affiliateProvider containing 'profitshare'
    const profitshareListing = {
      affiliateProvider: 'profitshare',
      affiliateProgram: null,
    };
    expect(isListingFromDisabledNetwork(profitshareListing)).toBe(true);

    // Test with affiliateProgram containing 'profitshare'
    const profitshareProgramListing = {
      affiliateProvider: null,
      affiliateProgram: 'profitshare-ro',
    };
    expect(isListingFromDisabledNetwork(profitshareProgramListing)).toBe(true);

    // Test case-insensitive matching
    const uppercaseListing = {
      affiliateProvider: 'PROFITSHARE',
      affiliateProgram: null,
    };
    expect(isListingFromDisabledNetwork(uppercaseListing)).toBe(true);
  });

  it('should not identify non-Profitshare listings as disabled', () => {
    const normalListing = {
      affiliateProvider: 'emag',
      affiliateProgram: 'awin_ro',
    };
    expect(isListingFromDisabledNetwork(normalListing)).toBe(false);

    const emptyListing = {
      affiliateProvider: null,
      affiliateProgram: null,
    };
    expect(isListingFromDisabledNetwork(emptyListing)).toBe(false);
  });

  it('should work end-to-end: public filtering vs admin visibility', () => {
    // Simulate a Profitshare listing
    const profitshareListing = {
      affiliateProvider: 'profitshare',
      affiliateProgram: null,
    };

    const isDisabled = isListingFromDisabledNetwork(profitshareListing);
    expect(isDisabled).toBe(true);

    // Public API should filter it out (isDisabled = true)
    // Admin UI should hide it when toggle is off
    expect(shouldShowListingInAdmin(isDisabled, false)).toBe(false);

    // Admin UI should show it when toggle is on
    expect(shouldShowListingInAdmin(isDisabled, true)).toBe(true);

    // Normal listing should always be shown in admin
    const normalListing = {
      affiliateProvider: 'emag',
      affiliateProgram: null,
    };

    const isNormalDisabled = isListingFromDisabledNetwork(normalListing);
    expect(isNormalDisabled).toBe(false);
    expect(shouldShowListingInAdmin(isNormalDisabled, false)).toBe(true);
    expect(shouldShowListingInAdmin(isNormalDisabled, true)).toBe(true);
  });
});
