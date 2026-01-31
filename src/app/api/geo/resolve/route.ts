import { NextRequest, NextResponse } from "next/server";

const GEO_API_URL = process.env.GEO_COUNTRY_API_URL;
const GEO_API_KEY = process.env.GEO_COUNTRY_API_KEY;

/**
 * GET /api/geo/resolve?lat=...&lng=...
 *
 * Returns: { countryCode: string | null }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { countryCode: null, error: "Missing coordinates" },
      { status: 400 },
    );
  }

  if (!GEO_API_URL || !GEO_API_KEY) {
    // Fallback: you must configure a real provider in .env
    return NextResponse.json(
      {
        countryCode: null,
        error: "Geo provider not configured (GEO_COUNTRY_API_URL / GEO_COUNTRY_API_KEY)",
      },
      { status: 500 },
    );
  }

  try {
    // This is intentionally generic: the actual provider is configurable via env.
    // Expect the provider to return a JSON with a country code somewhere in it.
    const url = new URL(GEO_API_URL);
    url.searchParams.set("lat", lat);
    url.searchParams.set("lng", lng);
    url.searchParams.set("key", GEO_API_KEY);

    const res = await fetch(url.toString(), {
      method: "GET",
    });

    if (!res.ok) {
      console.error("Geo resolve failed", res.status);
      return NextResponse.json(
        { countryCode: null, error: "Geo provider error" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as any;

    // TODO: adapt this mapping to your chosen provider.
    // For now we try common shapes: data.countryCode or data.country_code.
    const raw =
      data?.countryCode ??
      data?.country_code ??
      data?.country?.code ??
      null;

    const countryCode =
      typeof raw === "string" && raw.length === 2
        ? raw.toUpperCase()
        : null;

    return NextResponse.json({ countryCode });
  } catch (err) {
    console.error("Geo resolve error", err);
    return NextResponse.json(
      { countryCode: null, error: "Unexpected error" },
      { status: 500 },
    );
  }
}
