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
import { parseProfitshareCsv } from './profitshare';
import { normalizeCsvRow } from '@/lib/canonical';

export class ProfitshareAdapter extends BaseAffiliateAdapter {
  id = 'profitshare';
  name = 'Profitshare.ro';

  normalizeWithMeta(raw: string) {
    const { rows, skippedMissingFields, totalDataRows, headerError } = parseProfitshareCsv(raw);
    if (headerError) {
      return {
        normalized: [] as NormalizedListing[],
        totalRows: totalDataRows,
        skippedRows: skippedMissingFields,
        skippedMissingFields,
        headerError,
      };
    }

    if (rows.length === 0) {
      console.log(`[ProfitshareAdapter] No valid rows found. Skipped ${skippedMissingFields} of ${totalDataRows} rows.`);
      return {
        normalized: [] as NormalizedListing[],
        totalRows: totalDataRows,
        skippedRows: skippedMissingFields,
        skippedMissingFields,
      };
    }

    console.log(`[ProfitshareAdapter] Processing ${rows.length} valid rows (skipped ${skippedMissingFields} of ${totalDataRows})`);

    const normalized: NormalizedListing[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and we're 1-indexed

      try {
        const rowWithStore = {
          ...row,
          storeName:
            row.storeName ||
            this.extractStoreName(row.productUrl || row.affiliateUrl) ||
            'Unknown',
        };

        const norm = normalizeCsvRow(rowWithStore as any, 'profitshare');
        if (!norm.ok) {
          console.error(`[ProfitshareAdapter] Normalization failed row ${rowNumber}: ${norm.error}`);
          continue;
        }

        const c = norm.canonical;
        const brand = c.brand ?? this.extractBrand(c.productName, c.category ?? undefined);
        const storeId = this.extractStoreId(c.listing.storeName);

        const normalizedListing: NormalizedListing = {
          productTitle: c.productName,
          brand,
          category: this.normalizeCategory(c.category ?? undefined),
          gtin: c.externalId ?? undefined,

          storeId,
          storeName: c.listing.storeName,
          url: c.listing.url,
          price: c.listing.price,
          currency: c.listing.currency.toUpperCase(),

          deliveryDays: undefined,
          fastDelivery: undefined,
          inStock: c.listing.inStock ?? true,
          countryCode: 'RO',

          source: 'affiliate',
        };

        normalized.push(normalizedListing);
      } catch (error) {
        console.error(`[ProfitshareAdapter] Error processing row ${rowNumber}:`, error);
      }
    }

    console.log(`[ProfitshareAdapter] Successfully normalized ${normalized.length} listings`);
    return {
      normalized,
      totalRows: totalDataRows,
      skippedRows: skippedMissingFields,
      skippedMissingFields,
    };
  }

  /**
   * Normalize Profitshare CSV content into NormalizedListing[].
   */
  normalize(raw: string): NormalizedListing[] {
    const result = this.normalizeWithMeta(raw);
    if (result.headerError) {
      throw new Error(result.headerError);
    }
    return result.normalized;
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

  private extractStoreName(url?: string): string | undefined {
    if (!url) return undefined;
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return undefined;
    }
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
