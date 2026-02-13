/**
 * Normalized row from CSV/affiliate feed.
 * Product fields (productTitle, brand, category) are always required.
 * Listing fields (storeId, storeName, url, price, currency) are optional
 * to support "product-only" rows that define a Product without a Listing.
 */
export type NormalizedListing = {
  // Product fields (required)
  productTitle: string;
  brand: string;
  category: string;
  gtin?: string;

  // Listing fields (optional for product-only rows)
  storeId?: string;
  storeName?: string;
  url?: string;
  price?: number;
  currency?: string;
  imageUrl?: string; // Product image URL for listing

  // Optional listing metadata
  deliveryDays?: number;
  fastDelivery?: boolean;
  inStock?: boolean;
  countryCode?: string;
  source?: "sheet" | "affiliate";
  merchantId?: string;
  merchantFeedId?: string;
};

export interface AffiliateAdapter {
  id: string;
  name: string;
  normalize(raw: string): NormalizedListing[];
}
