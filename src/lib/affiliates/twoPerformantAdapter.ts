// src/lib/affiliates/twoPerformantAdapter.ts
// =============================================================================
// 2PERFORMANT AFFILIATE ADAPTER
// =============================================================================
//
// This adapter implements the AffiliateAdapter interface for 2Performant feeds.
// It normalizes 2Performant CSV data into the canonical NormalizedListing format
// and tags all listings as affiliate source, ready for importNormalizedListings.
//
// Usage:
//   const twoPerformantAdapter = new TwoPerformantAdapter();
//   const normalized = twoPerformantAdapter.normalize(csvContent);
//   await importNormalizedListings(normalized, {
//     source: 'affiliate',
//     affiliateProvider: '2performant',
//     network: 'TWOPERFORMANT',
//   });
// =============================================================================

import { BaseAffiliateAdapter } from "./base";
import type { NormalizedListing } from "./types";
import { parseTwoPerformantCsv, parseAvailability } from "./twoPerformant";
import { normalizeCsvRow } from "@/lib/canonical";

export class TwoPerformantAdapter extends BaseAffiliateAdapter {
  id = "2performant";
  name = "2Performant";

  /**
   * Normalize 2Performant CSV content into NormalizedListing[].
   * Each listing is tagged with normalized store and product data.
   */
  normalize(raw: string): NormalizedListing[] {
    const {
      rows,
      skippedMissingFields,
      totalRows,
      headerError,
    } = parseTwoPerformantCsv(raw);

    if (headerError) {
      console.error(`[TwoPerformantAdapter] Header error: ${headerError}`);
      return [];
    }

    if (rows.length === 0) {
      console.log(
        `[TwoPerformantAdapter] No valid rows found. Skipped ${skippedMissingFields} of ${totalRows} rows.`,
      );
      return [];
    }

    console.log(
      `[TwoPerformantAdapter] Processing ${rows.length} valid rows (skipped ${skippedMissingFields} of ${totalRows})`,
    );

    const normalized: NormalizedListing[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and we're 1-indexed

      try {
        const norm = normalizeCsvRow(row as any, '2performant');
        if (!norm.ok) {
          console.error(`[TwoPerformantAdapter] Normalization failed row ${rowNumber}: ${norm.error}`);
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
        console.error(`[TwoPerformantAdapter] Error processing row ${rowNumber}:`, error);
      }
    }

    console.log(
      `[TwoPerformantAdapter] Successfully normalized ${normalized.length} listings`,
    );
    return normalized;
  }

  /**
   * Extract a canonical store ID from store name.
   * Used for consistent store identification across the system.
   */
  private extractStoreId(storeName: string): string {
    if (!storeName) return "unknown";

    // Convert to lowercase, replace spaces and special chars with underscores
    return (
      storeName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .trim() || "unknown"
    );
  }

  /**
   * Extract brand from product name or category.
   * Simple heuristic, mirroring the Profitshare adapter.
   */
  private extractBrand(productName: string, categoryRaw?: string): string {
    // Simple heuristic: take the first word of the product name
    const firstWord = productName.trim().split(" ")[0];

    // If category is available and seems like a brand, use it
    if (categoryRaw) {
      const categoryLower = categoryRaw.toLowerCase().trim();

      // Common brand indicators in category
      if (
        categoryLower.includes("apple") ||
        categoryLower.includes("samsung") ||
        categoryLower.includes("xiaomi") ||
        categoryLower.includes("huawei")
      ) {
        return categoryRaw.trim();
      }
    }

    return firstWord || "Unknown";
  }

  /**
   * Normalize category into a canonical format.
   * Same mapping strategy as Profitshare adapter.
   */
  private normalizeCategory(categoryRaw?: string): string {
    if (!categoryRaw) return "General";

    const normalized = categoryRaw.trim();

    // Map common Romanian categories to English equivalents
    const categoryMap: Record<string, string> = {
      laptopuri: "Laptops",
      telefoane: "Smartphones",
      tablete: "Tablets",
      casti: "Audio",
      smartwatch: "Wearables",
      televizoare: "TVs",
      electronice: "Electronics",
      imbracaminte: "Clothing",
      incaltaminte: "Footwear",
    };

    const lowerKey = normalized.toLowerCase();
    return categoryMap[lowerKey] || normalized;
  }
}

// Export singleton instance for convenience
export const twoPerformantAdapter = new TwoPerformantAdapter();
