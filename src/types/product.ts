// src/types/product.ts

export interface ProductListing {
  id?: string;
  
  /** Store name - the mapper uses storeName, legacy uses store */
  storeName?: string;
  store?: string;
  storeLogoUrl?: string | null;
  
  url?: string | null;
  imageUrl?: string | null;

  price: number;
  currency?: string;
  shippingCost?: number | null;

  /** Estimated delivery time in days */
  deliveryTimeDays?: number | null;

  /** True if this is considered "fast delivery" (e.g. <= 2 days). */
  fastDelivery?: boolean;

  /** Location this listing is primarily targeting (city / country / region). */
  location?: string | null;

  /** Whether the item is currently in stock at this store. */
  inStock?: boolean;

  /** Optional rating between 0 and 5. */
  rating?: number | null;

  /** Optional number of reviews for this product on this store. */
  reviewCount?: number | null;

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
   * Date string (ISO format or YYYY-MM-DD). The mapper uses 'date'.
   */
  date?: string;
  /**
   * Month identifier. You can treat this as a label, e.g. "2025-01" or "Jan".
   * The chart component can display it directly. Legacy field.
   */
  month?: string;
  /** Price for that date/month. */
  price?: number;
  /** Average or representative price for that month. Legacy field. */
  averagePrice?: number;
  /** Currency code */
  currency?: string;
}

export interface ProductDealInfo {
  isGreatDeal: boolean;
  dealPercent: number | null;
  label: string | null;
}

export interface ProductWithHistory {
  /** Stable internal ID for the product (preferred). */
  id?: string;
  
  /** Alias for id - legacy field, some components use productId */
  productId?: string;

  /** Main user-facing name used in the UI. */
  displayName: string;

  /** Optional more technical or internal name. */
  name?: string;

  /** Optional product description. */
  description?: string | null;

  /** Category used for filtering or grouping (e.g. "Laptops", "Headphones"). */
  category?: string | null;

  /** Optional thumbnail for quick display. */
  thumbnailUrl?: string | null;
  
  /** Optional full-size image URL. */
  imageUrl?: string | null;

  /** Optional brand name. */
  brand?: string | null;

  /** Store-specific offers for this product. */
  listings: ProductListing[];

  /** Historical prices for the last 6–12 months. */
  priceHistory: ProductPriceHistoryPoint[];

  /** Optional deal info computed on the server (e.g. Black Friday style savings). */
  dealInfo?: ProductDealInfo;
}