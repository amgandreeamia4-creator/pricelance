// src/types/product.ts

export interface ProductListing {
  id: string;
  store: string;
  url: string;
  imageUrl: string;

  price: number;
  currency: string;
  shippingCost: number;

  /** Estimated delivery time in days */
  deliveryTimeDays: number;

  /** True if this is considered "fast delivery" (e.g. <= 2 days). */
  fastDelivery: boolean;

  /** Location this listing is primarily targeting (city / country / region). */
  location: string;

  /** Whether the item is currently in stock at this store. */
  inStock: boolean;

  /** Optional rating between 0 and 5. */
  rating?: number;

  /** Optional number of reviews for this product on this store. */
  reviewCount?: number;

  /** Optional provider/source tag, e.g. "static", "dummyjson", "ebay". */
  source?: string | null;

  /**
   * Optional flag indicating this is the primary listing we use for
   * sorting / quick comparisons. searchProducts can set this.
   */
  isPrimary?: boolean;
}

export interface ProductPriceHistoryPoint {
  /**
   * Month identifier. You can treat this as a label, e.g. "2025-01" or "Jan".
   * The chart component can display it directly.
   */
  month: string;
  /** Average or representative price for that month. */
  averagePrice: number;
}

export interface ProductDealInfo {
  isGreatDeal: boolean;
  dealPercent: number | null;
  label: string | null;
}

export interface ProductWithHistory {
  /** Stable internal ID for the product. */
  productId: string;

  /** Main user-facing name used in the UI. */
  displayName: string;

  /** Optional more technical or internal name. */
  name?: string;

  /** Category used for filtering or grouping (e.g. "Laptops", "Headphones"). */
  category: string;

  /** Optional thumbnail for quick display. */
  thumbnailUrl?: string;

  /** Optional brand name. */
  brand?: string;

  /** Store-specific offers for this product. */
  listings: ProductListing[];

  /** Historical prices for the last 6–12 months. */
  priceHistory: ProductPriceHistoryPoint[];

  /** Optional deal info computed on the server (e.g. Black Friday style savings). */
  dealInfo?: ProductDealInfo;
}