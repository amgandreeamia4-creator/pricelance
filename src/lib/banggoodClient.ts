/**
 * lib/banggoodClient.ts
 *
 * Banggood API client with signature generation and helper functions.
 * This module handles the complexity of Banggood's authentication and signature requirements.
 */

import crypto from 'crypto';

/**
 * Generic Banggood API response type
 */
export interface BanggoodResponse<T = unknown> {
  code: number;
  result: T | null;
  msg: string;
  [key: string]: any;
}

/**
 * Environment variables for Banggood API
 */
const BANGGOOD_API_KEY = process.env.BANGGOOD_API_KEY;
const BANGGOOD_API_SECRET = process.env.BANGGOOD_API_SECRET;

/**
 * Banggood API base URL
 */
const BANGGOOD_API_BASE_URL = 'https://affapi.banggood.com';

/**
 * Generate a random nonce string for Banggood API requests
 * @param length - Length of the nonce string (default: 32)
 * @returns Random alphanumeric string
 */
function generateNonceStr(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate timestamp for Banggood API requests
 * @returns Current Unix timestamp in seconds
 */
function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Build Banggood API signature according to official PHP sample
 * 
 * Signature Rules (matching Banggood PHP sample):
 * 1. Sort all parameters alphabetically by parameter name (ksort equivalent)
 * 2. Create http_build_query style string: key=value&key2=value2...
 * 3. Generate MD5 hash of the query string
 * 4. Return the MD5 hash (lowercase by default from Node.js crypto)
 * 
 * @param params - Object containing all API parameters (excluding signature)
 * @param secret - Banggood API secret key
 * @returns MD5 signature string
 */
export function buildBanggoodSignature(params: Record<string, string | number>, secret: string): string {
  // Rule 1: Sort parameters alphabetically by key (ksort equivalent)
  const sortedKeys = Object.keys(params).sort();
  
  // Rule 2: Create http_build_query style string
  const queryString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  
  // Rule 3: Generate MD5 hash of the query string
  const hash = crypto.createHash('md5').update(queryString, 'utf8').digest('hex');
  
  // Rule 4: Return MD5 hash (Node.js crypto returns lowercase by default)
  return hash;
}

/**
 * Build complete query parameters for Banggood API request
 * @param params - Base parameters (excluding api_key, noncestr, timestamp, signature)
 * @returns URLSearchParams object with all required parameters including signature
 */
export function buildBanggoodQuery(params: Record<string, string | number> = {}): URLSearchParams {
  if (!BANGGOOD_API_KEY || !BANGGOOD_API_SECRET) {
    throw new Error('BANGGOOD_API_KEY and BANGGOOD_API_SECRET environment variables are required');
  }

  // Add required authentication parameters
  const fullParams: Record<string, string | number> = {
    ...params,
    api_key: BANGGOOD_API_KEY,
    noncestr: generateNonceStr(),
    timestamp: generateTimestamp(),
  };

  // Generate signature
  const signature = buildBanggoodSignature(fullParams, BANGGOOD_API_SECRET);
  fullParams.signature = signature;

  // Convert to URLSearchParams
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(fullParams)) {
    searchParams.append(key, String(value));
  }

  return searchParams;
}

/**
 * Get access token from Banggood API
 * 
 * API Endpoint: GET https://affapi.banggood.com/getAccessToken
 * 
 * @returns Promise resolving to response object with HTTP status, raw text, and parsed JSON
 */
export async function banggoodGetAccessToken(): Promise<{
  httpStatus: number;
  rawText: string;
  json: BanggoodResponse<any> | null;
}> {
  try {
    // Build query parameters for getAccessToken endpoint
    const queryParams = buildBanggoodQuery();
    const url = `${BANGGOOD_API_BASE_URL}/getAccessToken?${queryParams.toString()}`;

    console.log('[Banggood] Requesting access token...');

    // Send request to Banggood API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PriceLance-Banggood-Playground/1.0',
      },
    });

    const httpStatus = response.status;
    const rawText = await response.text();

    // Parse JSON response
    let json: BanggoodResponse<any> | null = null;
    try {
      json = JSON.parse(rawText) as BanggoodResponse<any>;
    } catch (parseError) {
      console.error('[Banggood] Failed to parse JSON response:', parseError);
    }

    // Log non-sensitive information
    console.log('[Banggood] Access token response:', {
      httpStatus,
      banggoodCode: json?.code,
      banggoodMsg: json?.msg,
    });

    return {
      httpStatus,
      rawText,
      json,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Banggood] Error getting access token:', errorMessage);

    return {
      httpStatus: 0,
      rawText: errorMessage,
      json: null,
    };
  }
}
