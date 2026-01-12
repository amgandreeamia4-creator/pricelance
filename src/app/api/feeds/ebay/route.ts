// src/app/api/feeds/ebay/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.EBAY_CLIENT_ID_PROD!;
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET_PROD!;

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const BROWSE_BASE = "https://api.ebay.com/buy/browse/v1";

const MARKETPLACE_ID = process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US";
const DEFAULT_LIMIT = Number(process.env.EBAY_DEFAULT_LIMIT ?? "20");

async function getAppToken(): Promise<string> {
  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );

  const params = new URLSearchParams();
  params.set("grant_type", "client_credentials");
  params.set("scope", "https://api.ebay.com/oauth/api_scope");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`eBay token error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;

  if (!q) {
    return NextResponse.json(
      { error: "Missing q search parameter" },
      { status: 400 }
    );
  }

  try {
    const token = await getAppToken();

    const url = `${BROWSE_BASE}/item_summary/search?q=${encodeURIComponent(
      q
    )}&limit=${limit}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": MARKETPLACE_ID,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: "eBay search error", status: res.status, body: data },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
