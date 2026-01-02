// src/lib/affiliates/profitshareAdapter.ts
// =============================================================================
// PROFITSHARE AFFILIATE ADAPTER
// =============================================================================
//
// This adapter implements the AffiliateAdapter interface for Profitshare.ro feeds.
// It normalizes Profitshare CSV data into the canonical NormalizedListing format
// and tags all listings with network: 'PROFITSHARE' for filtering.
//
// Usage:
//   const profitshareAdapter = new ProfitshareAdapter();
//   const normalized = profitshareAdapter.normalize(csvContent);
//   await importNormalizedListings(normalized, {
//     source: 'affiliate',
//     affiliateProvider: 'profitshare',
//     network: 'PROFITSHARE',
//   });
// =============================================================================

import { BaseAffiliateAdapter } from './base';
import type { NormalizedListing } from './types';
import { parseProfitshareCsv, parseAvailability } from './profitshare';

export class ProfitshareAdapter extends BaseAffiliateAdapter {
  id = 'profitshare';
  name = 'Profitshare.ro';

  /**
   * Normalize Profitshare CSV content into NormalizedListing[].
   * Each listing is tagged with the appropriate store and network information.
   */
  normalize(raw: string): NormalizedListing[] {
    const { rows, skippedMissingFields, totalDataRows, headerError } = parseProfitshareCsv(raw);

    if (headerError) {
      console.error(`[ProfitshareAdapter] Header error: ${headerError}`);
      return [];
    }

    if (rows.length === 0) {
      console.log(`[ProfitshareAdapter] No valid rows found. Skipped ${skippedMissingFields} of ${totalDataRows} rows.`);
      return [];
    }

    console.log(`[ProfitshareAdapter] Processing ${rows.length} valid rows (skipped ${skippedMissingFields} of ${totalDataRows})`);

    const normalized: NormalizedListing[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and we're 1-indexed

      try {
        // Extract store name from URL for store_id
        const storeId = this.extractStoreId(row.storeName);

        // Parse availability
        const inStock = parseAvailability(row.availability);

        // Create normalized listing
        const normalizedListing: NormalizedListing = {
          // Product fields (required)
          productTitle: row.name.trim(),
          brand: this.extractBrand(row.name, row.categoryRaw),
          category: this.normalizeCategory(row.categoryRaw),
          gtin: row.gtin?.trim() || undefined,

          // Listing fields (optional for product-only rows)
          storeId,
          storeName: row.storeName.trim(),
          url: row.affiliateUrl || row.productUrl,
          price: row.price,
          currency: row.currency.toUpperCase(),

          // Optional listing metadata
          deliveryDays: undefined, // Profitshare doesn't provide this
          fastDelivery: undefined, // Profitshare doesn't provide this
          inStock,
          countryCode: 'RO', // Profitshare is Romania-focused

          // Source tracking
          source: 'affiliate',
        };

        normalized.push(normalizedListing);
      } catch (error) {
        console.error(`[ProfitshareAdapter] Error processing row ${rowNumber}:`, error);
        // Continue processing other rows
      }
    }

    console.log(`[ProfitshareAdapter] Successfully normalized ${normalized.length} listings`);
    return normalized;
  }

  /**
   * Extract a canonical store ID from store name or URL.
   * Used for consistent store identification across the system.
   */
  private extractStoreId(storeName: string): string {
    if (!storeName) return 'unknown';
    
    // Convert to lowercase, replace spaces and special chars with underscores
    return storeName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim() || 'unknown';
  }

  /**
   * Extract brand from product name or category.
   * This is a simple heuristic - for better results, consider using
   * a brand extraction library or manual mapping.
   */
  private extractBrand(productName: string, categoryRaw?: string): string {
    // Simple heuristic: take the first word of the product name
    const firstWord = productName.trim().split(' ')[0];
    
    // If category is available and seems like a brand, use it
    if (categoryRaw) {
      const categoryLower = categoryRaw.toLowerCase().trim();
      
      // Common brand indicators in category
      if (categoryLower.includes('apple') || 
          categoryLower.includes('samsung') ||
          categoryLower.includes('xiaomi') ||
          categoryLower.includes('huawei')) {
        return categoryRaw.trim();
      }
    }
    
    return firstWord || 'Unknown';
  }

  /**
   * Normalize category into a canonical format.
   */
  private normalizeCategory(categoryRaw?: string): string {
    if (!categoryRaw) return 'General';
    
    const normalized = categoryRaw.trim();
    
    // Map common Romanian categories to English equivalents
    const categoryMap: Record<string, string> = {
      'laptopuri': 'Laptops',
      'telefoane': 'Smartphones',
      'tablete': 'Tablets',
      'casti': 'Audio',
      'smartwatch': 'Wearables',
      'televizoare': 'TVs',
      'electronice': 'Electronics',
      'imbracaminte': 'Clothing',
      'incaltaminte': 'Footwear',
    };
    
    const lowerKey = normalized.toLowerCase();
    return categoryMap[lowerKey] || normalized;
  }
}

// Export singleton instance for convenience
export const profitshareAdapter = new ProfitshareAdapter();
