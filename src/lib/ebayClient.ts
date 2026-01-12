// lib/ebayClient.ts
//
// Minimal eBay Browse API client for PriceLance
// - Uses OAuth client-credentials to get an Application access token
// - Calls /buy/browse/v1/item_summary/search
// - Normalizes items into a clean structure for the app

const EBAY_OAUTH_ENDPOINT = "https://api.sandbox.ebay.com/identity/v1/oauth2/token";
const EBAY_BROWSE_BASE_URL = "https://api.sandbox.ebay.com/buy/browse/v1";
const EBAY_SCOPES =
  "https://api.ebay.com/oauth/api_scope";

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID!;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET!;
const EBAY_MARKETPLACE_ID = process.env.EBAY_MARKETPLACE_ID || "EBAY_DE";
const EBAY_DEFAULT_LIMIT = Number(process.env.EBAY_DEFAULT_LIMIT || 20);

// Simple in-memory cache for the app access token
let cachedToken:
  | {
      accessToken: string;
      expiresAt: number; // epoch seconds
    }
  | null = null;

function ensureEnv() {
  if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) {
    throw new Error(
      "Missing EBAY_CLIENT_ID or EBAY_CLIENT_SECRET in environment variables."
    );
  }
}

async function getAppAccessToken(): Promise<string> {
  ensureEnv();

  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedToken.expiresAt - 60 > now) {
    // still valid (60s safety window)
    return cachedToken.accessToken;
  }

  const basicAuth = Buffer.from(
    `${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`,
    "utf8"
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: EBAY_SCOPES,
  });

  const res = await fetch(EBAY_OAUTH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Failed to fetch eBay OAuth token: ${res.status} ${res.statusText} - ${text}` 
    );
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  const expiresAt = now + (json.expires_in || 0);

  cachedToken = {
    accessToken: json.access_token,
    expiresAt,
  };

  return json.access_token;
}

export type EbayListing = {
  source: "ebay";
  marketplaceId: string;
  externalId: string; // itemId
  title: string;
  price: number | null;
  currency: string | null;
  url: string | null;
  imageUrl?: string | null;
  sellerName?: string | null;
  raw?: unknown; // optional: full raw item if you want to inspect/debug
};

export type EbaySearchResult = {
  query: string;
  limit: number;
  total: number;
  items: EbayListing[];
};

export async function searchEbayItems(
  query: string,
  options?: { limit?: number }
): Promise<EbaySearchResult> {
  if (!query.trim()) {
    throw new Error("Empty query");
  }

  const accessToken = await getAppAccessToken();

  const limit = options?.limit ?? EBAY_DEFAULT_LIMIT;

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  const url = `${EBAY_BROWSE_BASE_URL}/item_summary/search?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-EBAY-C-MARKETPLACE-ID": EBAY_MARKETPLACE_ID,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `eBay search failed: ${res.status} ${res.statusText} - ${text}` 
    );
  }

  const data = (await res.json()) as any;

  const items: EbayListing[] = Array.isArray(data.itemSummaries)
    ? data.itemSummaries.map((item: any): EbayListing => {
        const priceObj = item.price || item.currentBidPrice;
        const image =
          item.image?.imageUrl ??
          (Array.isArray(item.additionalImages)
            ? item.additionalImages[0]?.imageUrl
            : null);

        return {
          source: "ebay",
          marketplaceId: EBAY_MARKETPLACE_ID,
          externalId: item.itemId,
          title: item.title,
          price: priceObj ? Number(priceObj.value) : null,
          currency: priceObj ? String(priceObj.currency) : null,
          url: item.itemWebUrl || null,
          imageUrl: image || null,
          sellerName: item.seller?.username || null,
          raw: item,
        };
      })
    : [];

  return {
    query,
    limit,
    total: typeof data.total === "number" ? data.total : items.length,
    items,
  };
}
