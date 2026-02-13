// src/lib/affiliates/banggood.ts
// Banggood affiliate adapter - real implementation using Banggood Affiliate Data API

import { createHash, randomBytes } from "crypto";
import type { NormalizedListing } from "./types";

const BANGGOOD_APP_KEY = process.env.BANGGOOD_APP_KEY;
const BANGGOOD_APP_SECRET = process.env.BANGGOOD_APP_SECRET;

if (process.env.NODE_ENV !== "production") {
  if (!BANGGOOD_APP_KEY || !BANGGOOD_APP_SECRET) {
     
    console.warn(
      "[Banggood] BANGGOOD_APP_KEY / BANGGOOD_APP_SECRET are not set. Banggood import will fail until they are configured."
    );
  }
}

type BanggoodAccessTokenResponse = {
  code: number;
  msg: string;
  result?: {
    access_token: string;
    expires_in: number; // seconds
  };
};

type BanggoodProduct = {
  product_id: number;
  product_url: string;
  category_id: number;
  product_name: string;
  product_price: string | number;
  product_coupon_price?: string;
  commission?: string;
  coupon_name?: string;
  coupon_code?: string;
  small_image?: string;
  list_grid_image?: string;
  view_image?: string;
  modify_date?: string;
};

type BanggoodProductListResponse = {
  code: number;
  msg: string;
  result?: {
    page_total: number;
    product_list: BanggoodProduct[];
  };
};

// Very small in-memory token cache to avoid calling getAccessToken for every request.
let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0; // epoch ms

function buildBanggoodSignature(params: {
  api_key: string;
  api_secret: string;
  noncestr: string;
  timestamp: string;
}): string {
  const sortedKeys = Object.keys(params).sort();
  const base = sortedKeys
    .map((key) => `${key}=${params[key as keyof typeof params]}`)
    .join("&");

  return createHash("md5").update(base, "utf8").digest("hex");
}

async function getBanggoodAccessToken(): Promise<string> {
  if (!BANGGOOD_APP_KEY || !BANGGOOD_APP_SECRET) {
    throw new Error(
      "[Banggood] Missing BANGGOOD_APP_KEY or BANGGOOD_APP_SECRET environment variables"
    );
  }

  const now = Date.now();
  // Reuse valid token if not close to expiry (60s safety margin).
  if (cachedAccessToken && now < cachedAccessTokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const noncestr = randomBytes(16).toString("hex").slice(0, 32);
  const timestamp = Math.floor(now / 1000).toString();

  const signature = buildBanggoodSignature({
    api_key: BANGGOOD_APP_KEY,
    api_secret: BANGGOOD_APP_SECRET,
    noncestr,
    timestamp,
  });

  const url = new URL("https://affapi.banggood.com/getAccessToken");
  url.searchParams.set("api_key", BANGGOOD_APP_KEY);
  url.searchParams.set("noncestr", noncestr);
  url.searchParams.set("timestamp", timestamp);
  url.searchParams.set("signature", signature);

  const res = await fetch(url.toString(), {
    method: "GET",
    // Banggood API does not require any special headers for this endpoint.
  });

  if (!res.ok) {
    throw new Error(
      `[Banggood] getAccessToken HTTP error: ${res.status} ${res.statusText}` 
    );
  }

  const data = (await res.json()) as BanggoodAccessTokenResponse;

  if (data.code !== 200 || !data.result?.access_token) {
    throw new Error(
      `[Banggood] getAccessToken failed: code=${data.code}, msg=${data.msg}` 
    );
  }

  cachedAccessToken = data.result.access_token;
  cachedAccessTokenExpiresAt = now + data.result.expires_in * 1000;

  return cachedAccessToken;
}

/**
 * Normalize a single Banggood product object into NormalizedListing.
 */
export function normalizeBanggoodProduct(
  raw: BanggoodProduct,
  opts?: { currency?: string }
): NormalizedListing {
  const priceStr = raw.product_price != null ? String(raw.product_price) : "";
  const numericPrice = priceStr
    ? Number.parseFloat(priceStr.replace(/[^\d.]/g, ""))
    : undefined;

  return {
    productTitle: raw.product_name ?? "",
    // Let existing brand detection logic infer brand from title if possible.
    brand: "",
    // Let our existing categorization/inference handle this for now.
    category: "",
    url: raw.product_url,
    price: Number.isFinite(numericPrice ?? NaN) ? numericPrice : undefined,
    currency: opts?.currency ?? "USD",
    imageUrl: raw.view_image || raw.list_grid_image || raw.small_image,
    storeId: "banggood",
    storeName: "Banggood",
    source: "affiliate",
  };
}

/**
 * Fetch products from Banggood API and return them as NormalizedListing[].
 * NOTE: categoryId, page and pageSize are currently very light wrappers.
 */
export async function fetchBanggoodProducts(params: {
  categoryId?: string;
  page?: number;
  pageSize?: number;
  keyword?: string;
  currency?: string;
  lang?: string;
}): Promise<NormalizedListing[]> {
  const {
    categoryId,
    keyword,
    currency = "USD",
    lang = "en-GB",
    // page and pageSize are reserved for future use – the current API
    // version does not expose explicit paging parameters for product/list.
  } = params;

  const accessToken = await getBanggoodAccessToken();

  const url = new URL("https://affapi.banggood.com/product/list");
  url.searchParams.set("lang", lang);
  url.searchParams.set("currency", currency);

  if (categoryId) {
    url.searchParams.set("category_id", categoryId);
  }

  if (keyword) {
    url.searchParams.set("keyword", keyword);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "access-token": accessToken,
    },
  });

  if (!res.ok) {
    throw new Error(
      `[Banggood] product/list HTTP error: ${res.status} ${res.statusText}` 
    );
  }

  const data = (await res.json()) as BanggoodProductListResponse;

  if (data.code !== 200 || !data.result) {
    throw new Error(
      `[Banggood] product/list failed: code=${data.code}, msg=${data.msg}` 
    );
  }

  const { product_list } = data.result;
  if (!Array.isArray(product_list) || product_list.length === 0) {
    return [];
  }

  return product_list.map((p) =>
    normalizeBanggoodProduct(p, { currency })
  );
}
