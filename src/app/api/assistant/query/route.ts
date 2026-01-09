// src/app/api/assistant/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/productService";
import type { SearchStatus, ProviderStatus } from "@/lib/searchStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssistantRequestBody = {
  message?: string;
  countryCode?: string;
};

const baseCategoryKeywords = [
  "honey",
  "coffee",
  "tea",
  "olive oil",
  "rice",
  "pasta",
  "shampoo",
  "conditioner",
  "toothpaste",
  "soap",
  "detergent",
  "dish soap",
  "paper towels",
  "toilet paper",
  "laptop",
  "notebook",
  "headphones",
  "earbuds",
  "smartphone",
  "iphone",
  "charger",
  "phone charger",
  "monitor",
  "keyboard",
  "mouse",
];

const brandKeywords = [
  "nike",
  "adidas",
  "samsung",
  "apple",
  "sony",
  "lenovo",
  "dell",
  "hp",
  "philips",
  "lg",
];

const categoryKeywords = [
  ...baseCategoryKeywords,
  "shoes",
  "sneakers",
  "tv",
  "tvs",
  "television",
  "phones",
  "earphones",
  "earbuds",
  "monitors",
];

const dealKeywords = [
  "hottest offer",
  "best deal",
  "cheapest",
  "lowest price",
  "right now",
  "deal",
  "offers",
];

const LOCATION_KEYWORDS = [
  "near me",
  "nearby",
  "in my surroundings",
  "around me",
  "close by",
];

const COUNTRY_NAME_MAP: Record<string, string> = {
  romania: "RO",
  germany: "DE",
  france: "FR",
  usa: "US",
  "united states": "US",
};

function normalizeCountryCode(raw?: string | null): string | null {
  if (!raw) return null;
  const up = raw.trim().toUpperCase();
  if (up.length === 2) return up;
  return null;
}

function detectCountryFromMessage(lower: string): string | null {
  for (const [name, code] of Object.entries(COUNTRY_NAME_MAP)) {
    if (lower.includes(name)) return code;
  }
  return null;
}

function extractIntent(messageRaw: string, initialCountryCode?: string | null) {
  const lower = messageRaw.toLowerCase();

  const foundBrand = brandKeywords.find((b) => lower.includes(b)) ?? null;
  const foundCategory = categoryKeywords.find((c) => lower.includes(c)) ?? null;
  const dealMode = dealKeywords.some((d) => lower.includes(d));
  const locationIntent = LOCATION_KEYWORDS.some((kw) => lower.includes(kw));

  // Prefer explicit country names in the message over initial selection
  const explicitCountry = detectCountryFromMessage(lower);
  const countryCode =
    normalizeCountryCode(explicitCountry) ?? normalizeCountryCode(initialCountryCode ?? null);

  let searchQuery: string | null = null;

  if (foundBrand && foundCategory) {
    searchQuery = `${foundBrand} ${foundCategory}`;
  } else if (foundBrand) {
    searchQuery = foundBrand;
  } else if (foundCategory) {
    searchQuery = foundCategory;
  } else {
    searchQuery = messageRaw.trim();
  }

  return {
    searchQuery,
    brand: foundBrand,
    category: foundCategory,
    dealMode,
    locationIntent,
    countryCode,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as AssistantRequestBody;
    const message = (body.message ?? "").trim();
    const bodyCountryCode = body.countryCode ?? null;

    if (!message) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_message",
          message: "Request body must include a non-empty 'message' field.",
        },
        { status: 400 }
      );
    }

    const { searchQuery, brand, category, dealMode, locationIntent, countryCode } =
      extractIntent(message, bodyCountryCode);

    const query = searchQuery.trim();

    if (!query) {
      return NextResponse.json({
        ok: true,
        status: "error" as SearchStatus,
        providerStatus: { catalog: "ok" } as ProviderStatus,
        query: "",
        summary:
          "I couldn't understand what to search for. Try asking about a product like 'honey' or 'laptop'.",
        bestDeal: null,
        alternatives: [],
        products: [],
        brand,
        category,
        dealMode,
        locationIntent,
        countryCode,
      });
    }

    const searchResult = await searchProducts(query, {});
    let products = (searchResult.products ?? []) as any[];

    // Brand-aware filtering if we detected a brand
    if (brand) {
      const brandLower = brand.toLowerCase();
      products = products.filter((p) => {
        const name: string =
          (p as any).name ?? (p as any).displayName ?? "";
        const prodBrand: string = (p as any).brand ?? "";
        return (
          prodBrand.toLowerCase().includes(brandLower) ||
          name.toLowerCase().includes(brandLower)
        );
      });
    }

    let flatListings: {
      productId: string;
      productName: string;
      brand: string | null;
      storeName: string;
      url: string | null;
      price: number;
      currency: string;
      listingsCountForProduct: number;
      countryCode: string | null;
    }[] = [];

    for (const p of products) {
      const productId = (p as any).id ?? "";
      const productName = (p as any).name ?? (p as any).displayName ?? "";
      const listings = ((p as any).Listing ?? []) as any[];
      const prodBrand: string | null = (p as any).brand ?? null;
      const listingsCountForProduct = listings.length;

      for (const l of listings) {
        const price = typeof l.price === "number" ? l.price : NaN;
        if (Number.isNaN(price)) continue;

        flatListings.push({
          productId,
          productName,
          brand: prodBrand,
          storeName: l.storeName ?? "",
          url: l.url ?? null,
          price,
          currency: l.currency ?? "USD",
          listingsCountForProduct,
          countryCode: (l as any).countryCode ?? null,
        });
      }
    }

    // If a countryCode is present, prefer listings in that country
    if (countryCode) {
      const ccUpper = countryCode.toUpperCase();
      const inCountry = flatListings.filter(
        (l) => (l.countryCode ?? "").toUpperCase() === ccUpper
      );
      if (inCountry.length > 0) {
        flatListings = inCountry;
      }
    }

    if (dealMode) {
      flatListings.sort((a, b) => {
        if (a.price !== b.price) return a.price - b.price;
        return b.listingsCountForProduct - a.listingsCountForProduct;
      });
    } else {
      flatListings.sort((a, b) => a.price - b.price);
    }

    const hasResults = flatListings.length > 0;
    const status: SearchStatus = hasResults ? "ok" : "no-results";
    const providerStatus: ProviderStatus = { catalog: "ok" };

    if (!hasResults) {
      const summary = `I couldn’t find any products matching '${query}' in the catalog yet.`;

      return NextResponse.json({
        ok: true,
        status,
        providerStatus,
        query,
        summary,
        bestDeal: null,
        alternatives: [],
        products: [],
        brand,
        category,
        dealMode,
        locationIntent,
        countryCode,
      });
    }

    const bestDeal = flatListings[0];
    const alternatives = flatListings.slice(1, 5);

    const humanName = query;

    let summary: string;

    if (brand && category) {
      const altPrices = alternatives.map((a) => a.price);
      const minAlt = altPrices.length ? Math.min(...altPrices) : null;
      const maxAlt = altPrices.length ? Math.max(...altPrices) : null;
      const countryPrefix =
        countryCode && locationIntent
          ? `Right now in ${countryCode}, the hottest offer on`
          : "Right now, the hottest offer on";

      summary = `${countryPrefix} ${brand} ${category} is ${bestDeal.price.toFixed(
        2
      )} ${bestDeal.currency} at ${bestDeal.storeName}`;

      if (bestDeal.productName) {
        summary += ` for '${bestDeal.productName}'.`;
      } else {
        summary += ".";
      }

      if (alternatives.length > 0 && minAlt != null && maxAlt != null) {
        summary += ` I also found ${alternatives.length} other offer$${
          alternatives.length > 1 ? "s" : ""
        } between ${minAlt.toFixed(2)} and ${maxAlt.toFixed(2)} ${
          bestDeal.currency
        }.`;
      }
    } else if (category) {
      const countryPrefix =
        countryCode && locationIntent
          ? `Right now in ${countryCode}, the best price I found for`
          : "The best price I found for";

      summary = `${countryPrefix} ${category} is ${bestDeal.price.toFixed(
        2
      )} ${bestDeal.currency} at ${bestDeal.storeName}`;

      if (bestDeal.productName) {
        summary += ` for '${bestDeal.productName}'.`;
      } else {
        summary += ".";
      }

      if (alternatives.length > 0) {
        const altText = alternatives
          .map((alt) =>
            `${alt.price.toFixed(2)} ${alt.currency} at ${alt.storeName}`
          )
          .join(", ");

        summary += ` A few other options: ${altText}.`;
      }
    } else {
      const countryPrefix =
        countryCode && locationIntent
          ? `Right now in ${countryCode}, the best price I found for`
          : "The best price I found for";

      summary = `${countryPrefix} ${humanName} is ${bestDeal.price.toFixed(
        2
      )} ${bestDeal.currency} at ${bestDeal.storeName}`;

      if (bestDeal.productName) {
        summary += ` for '${bestDeal.productName}'.`;
      } else {
        summary += ".";
      }

      if (alternatives.length > 0) {
        const altText = alternatives
          .map((alt) =>
            `${alt.price.toFixed(2)} ${alt.currency} at ${alt.storeName}`
          )
          .join(", ");

        summary += ` A few other options: ${altText}.`;
      }
    }

    return NextResponse.json({
      ok: true,
      status,
      providerStatus,
      query,
      summary,
      bestDeal,
      alternatives,
      products,
      brand,
      category,
      dealMode,
      locationIntent,
      countryCode,
    });
  } catch (error) {
    console.error("[/api/assistant/query] Failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "assistant_failed",
        message:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Internal error handling assistant query.",
      },
      { status: 200 }
    );
  }
}
