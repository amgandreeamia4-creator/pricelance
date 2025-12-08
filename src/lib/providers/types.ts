import type { IngestPayload } from "@/lib/ingestService";

export type ProviderId = "static" | "dummyjson" | "realstore";

/**
 * Error types that can occur when calling a provider.
 */
export type ProviderErrorType = 
  | "timeout"
  | "network_error"
  | "http_error"
  | "parse_error"
  | "config_missing"
  | "unknown";

/**
 * Extended result from a provider search that includes error information.
 * This allows the UI to distinguish between "no results" and "provider failed".
 */
export interface ProviderSearchResult {
  payloads: IngestPayload[];
  error?: {
    type: ProviderErrorType;
    message: string;
    httpStatus?: number;
  };
}

export interface ProductProvider {
  /** Short internal name, e.g. "static", "dummyjson", "realstore". */
  name: string;
  /**
   * Search for products based on a user-facing query and return ingest payloads.
   * These payloads are later passed to ingestProducts to update the DB.
   * 
   * @deprecated Use searchProductsWithStatus for better error handling.
   */
  searchProducts(query: string): Promise<IngestPayload[]>;
  
  /**
   * Search for products with detailed status/error information.
   * Returns both payloads and any error that occurred.
   */
  searchProductsWithStatus?(query: string): Promise<ProviderSearchResult>;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  enabled: boolean;
  baseUrl?: string;
  apiKeyEnvVar?: string;
  timeoutMs?: number;
}
