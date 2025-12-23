import { NextRequest, NextResponse } from "next/server";

type Listing = {
  id?: string;
  storeId?: string | null;
  storeName?: string | null;
  price?: number | string | null;
  currency?: string | null;
};

type Product = {
  id?: string;
  name?: string | null;
  displayName?: string | null;
  brand?: string | null;
  category?: string | null;
  listings?: Listing[];
};

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantRequestBody = {
  messages?: AssistantMessage[];
  products?: Product[];
  query?: string; // current search query from the UI
  location?: string;
  selectedProductId?: string | null;
  favoriteIds?: string[];
};

type AssistantResponseBody = {
  ok: boolean;
  answer: string;
};

type ConstraintSummary = {
  maxBudget: number | null;
  storageTokens: string[];
  brandTokens: string[];
};

type RankedProduct = {
  product: Product;
  cheapestListing: Listing | null;
};
const CURRENCY_HINTS = [
  "ron",
  "lei",
  "eur",
  "euro",
  "usd",
  "dollars",
  "$",
  "gbp",
  "pounds",
  "£",
];

function parseBudgetNumber(raw: string): number | null {
  // Accept things like "3.000", "3,000", "3000", "3 000"
  const cleaned = raw.replace(/[.,\s]/g, "");
  if (!cleaned) return null;
  const value = parseInt(cleaned, 10);
  return Number.isNaN(value) ? null : value;
}

function normalizeText(value: string | undefined | null): string {
  return (value ?? "").toLowerCase();
}

function extractMaxBudget(query: string): number | null {
  const q = query.toLowerCase();

  // Examples handled:
  // - "under 3.000"
  // - "below 2,500 eur"
  // - "max 2000"
  // - "budget 3500 lei"
  // - "3000 ron"
  // - "3,000 usd budget"
  const patterns: RegExp[] = [
    /(under|below|less than)\s+([\d.,\s]{3,})/,
    /(max(?:imum)?)\s+([\d.,\s]{3,})/,
    /(budget)\s+([\d.,\s]{3,})/,
    // number + optional currency + optional "budget" / "max"
    /([\d.,\s]{3,})\s*([a-z$£€]+)?\s*(budget|max)?/,
  ];

  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (!match) continue;

    // For the first 3 patterns, the numeric part is in group 2
    // For the last pattern, the numeric part is in group 1
    const numericGroupIndex = pattern === patterns[3] ? 1 : 2;
    const rawNumber = match[numericGroupIndex];
    if (!rawNumber) continue;

    const value = parseBudgetNumber(rawNumber);
    if (value === null) continue;

    const currencyRaw =
      pattern === patterns[3] ? match[2] ?? "" : match[3] ?? "";
    const currencyClean = (currencyRaw || "")
      .toLowerCase()
      .replace(/[^a-z$£€]/g, "");

    if (currencyClean && !CURRENCY_HINTS.includes(currencyClean)) {
      // Unknown currency hint; still accept the number, just ignore the word.
    }

    return value;
  }

  return null;
}

function extractStorageTokens(query: string): string[] {
  const q = query.toLowerCase();
  const tokens: string[] = [];

  const regex = /(\d+)\s*(gb|tb)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(q)) !== null) {
    tokens.push(`${match[1]}${match[2]}`); // e.g. "256gb"
  }

  return tokens;
}

function extractBrandTokens(query: string): string[] {
  const q = query.toLowerCase();
  const words = q.split(/[^a-z0-9]+/).filter(Boolean);

  const stop = new Set([
    "cheapest",
    "best",
    "laptop",
    "laptops",
    "phone",
    "phones",
    "iphone",
    "android",
    "monitor",
    "monitors",
    "headphones",
    "earbuds",
    "keyboard",
    "mouse",
    "price",
    "prices",
    "under",
    "below",
    "budget",
  ]);

  const candidates = words.filter((w) => w.length >= 3 && !stop.has(w));
  return Array.from(new Set(candidates));
}

function getNumericPrice(value?: number | string | null): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = value.replace(/[^\d.,]/g, "").replace(/[\,\s]/g, "");
  if (!cleaned) return null;
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

function getStorePreferenceScore(
  storeId: string | null | undefined,
  location: string | undefined,
): number {
  if (!storeId || !location) return 0;

  const loc = location.toLowerCase();
  const id = storeId.toLowerCase();

  const isRomania = loc.includes("romania") || loc === "ro";
  const isGermany = loc.includes("germany") || loc === "de";
  const isUK = loc.includes("united kingdom") || loc === "uk";

  if (isRomania) {
    if (id === "emag" || id === "altex" || id === "pcgarage" || id === "flanco") {
      return 3;
    }
    if (id === "other_eu" || id === "amazon_de") {
      return 1;
    }
  }

  if (isGermany) {
    if (id === "amazon_de" || id === "other_eu") {
      return 2;
    }
  }

  if (isUK) {
    if (id === "other_eu") {
      return 1;
    }
  }

  return 0;
}

function getCheapestListing(product: Product): Listing | null {
  if (!Array.isArray(product.listings) || product.listings.length === 0) {
    return null;
  }

  let cheapest: Listing | null = null;

  for (const l of product.listings) {
    const price = getNumericPrice(l?.price ?? null);
    if (price == null) continue;

    if (!cheapest) {
      cheapest = l;
      continue;
    }

    const cheapestPrice = getNumericPrice(cheapest.price ?? null);
    if (cheapestPrice == null || price < cheapestPrice) {
      cheapest = l;
    }
  }

  return cheapest;
}

function rankAndFilterProducts(
  products: Product[],
  constraints: ConstraintSummary,
  location?: string,
): RankedProduct[] {
  const { maxBudget, storageTokens, brandTokens } = constraints;

  const base: RankedProduct[] = products.map((p) => ({
    product: p,
    cheapestListing: getCheapestListing(p),
  }));

  let filtered = base.filter((rp) => rp.cheapestListing !== null);

  if (maxBudget !== null) {
    filtered = filtered.filter((rp) => {
      const price = getNumericPrice(rp.cheapestListing?.price ?? null);
      return price != null && price <= maxBudget;
    });
  }

  if (storageTokens.length > 0) {
    filtered = filtered.filter((rp) => {
      const text = `${rp.product.name ?? ""} ${rp.product.displayName ?? ""}`.toLowerCase();
      return storageTokens.every((token) => text.includes(token));
    });
  }

  if (brandTokens.length > 0) {
    filtered = filtered.filter((rp) => {
      const brand = normalizeText(rp.product.brand);
      const name = normalizeText(rp.product.name);
      return brandTokens.some(
        (token) => brand.includes(token) || name.includes(token),
      );
    });
  }

  filtered.sort((a, b) => {
    const ap =
      getNumericPrice(a.cheapestListing?.price ?? null) ??
      Number.POSITIVE_INFINITY;
    const bp =
      getNumericPrice(b.cheapestListing?.price ?? null) ??
      Number.POSITIVE_INFINITY;

    // Primary key: price
    const base = ap - bp;
    if (base !== 0) return base;

    // Tiebreaker: store preference based on `location`
    const aStoreId =
      (a.cheapestListing?.storeId as string | null | undefined) ?? null;
    const bStoreId =
      (b.cheapestListing?.storeId as string | null | undefined) ?? null;

    const aScore = getStorePreferenceScore(aStoreId, location);
    const bScore = getStorePreferenceScore(bStoreId, location);

    return bScore - aScore;
  });

  return filtered;
}

type AssistantIntent = "cheapest" | "best_value" | "filter" | "generic";

function getLastUserMessage(
  messages: AssistantMessage[] | undefined,
): AssistantMessage | null {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    if (m.role === "user" && typeof m.content === "string") {
      return m;
    }
  }
  return null;
}

function detectIntent(text: string): AssistantIntent {
  const q = text.toLowerCase();

  if (
    q.includes("cheapest") ||
    q.includes("lowest price") ||
    q.includes("lowest") ||
    q.includes("least expensive") ||
    q.includes("cheaper option")
  ) {
    return "cheapest";
  }

  if (q.includes("best value") || q.includes("value for money")) {
    return "best_value";
  }

  if (
    /under\s+\d/.test(q) ||
    /below\s+\d/.test(q) ||
    /max\s+\d/.test(q) ||
    /at most\s+\d/.test(q) ||
    /at least\s+\d/.test(q) ||
    /minimum\s+\d/.test(q) ||
    /\d+\s*(ron|lei|eur|euro|usd|gbp)/.test(q) ||
    /\d+\s*(gb|tb)/.test(q)
  ) {
    return "filter";
  }

  return "generic";
}

function getSearchTokensFromText(text: string): string[] {
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const stop = new Set([
    "cheapest",
    "cheap",
    "cheaper",
    "option",
    "options",
    "here",
    "show",
    "me",
    "the",
    "this",
    "one",
    "product",
    "products",
    "best",
    "value",
    "filter",
    "under",
    "over",
    "below",
    "above",
    "than",
    "with",
    "least",
    "most",
    "which",
    "what",
    "whats",
    "what's",
  ]);

  return words.filter((w) => w.length >= 3 && !stop.has(w));
}

function findProductsByText(
  products: Product[],
  text: string,
): Product[] {
  const tokens = getSearchTokensFromText(text);
  if (tokens.length === 0) return [];

  return products.filter((p) => {
    const haystack = normalizeText(
      `${p.name ?? ""} ${p.displayName ?? ""} ${p.brand ?? ""}`,
    );
    return tokens.every((t) => haystack.includes(t));
  });
}

function buildCheapestAnswer(params: {
  products: Product[];
  questionText: string;
  searchQuery?: string;
  location?: string;
  selectedProductId?: string | null;
  favoriteIds?: Set<string>;
}): string {
  const {
    products,
    questionText,
    searchQuery,
    location,
    selectedProductId,
    favoriteIds,
  } = params;

  if (!products.length) {
    return "I don't see any products in the current results. Try running a search first.";
  }

  const q = questionText.toLowerCase();

  let baseProducts: Product[] = products;
  let scopeLabel = "in the current results";

  const refersToThis =
    q.includes("this product") || q.includes("this one") || q.includes("this");

  if (refersToThis && selectedProductId) {
    const selected = products.find(
      (p) =>
        p.id != null && String(p.id) === String(selectedProductId ?? ""),
    );
    if (selected) {
      baseProducts = [selected];
      scopeLabel = "for this product";
    }
  } else {
    const byText = findProductsByText(products, questionText);
    if (byText.length > 0) {
      baseProducts = byText;
      scopeLabel = "for that kind of product in the current results";
    }
  }

  let candidateProducts = baseProducts;

  if (favoriteIds && favoriteIds.size > 0) {
    const favoriteProducts = baseProducts.filter(
      (p) => p.id != null && favoriteIds.has(String(p.id)),
    );
    if (favoriteProducts.length > 0) {
      candidateProducts = favoriteProducts;
      scopeLabel = "among your favorites in the current results";
    }
  }

  const ranked = rankAndFilterProducts(
    candidateProducts,
    { maxBudget: null, storageTokens: [], brandTokens: [] },
    location,
  );

  if (ranked.length === 0) {
    return "I don't see any products with clear prices in the current results.";
  }

  const best = ranked[0];
  const listing = best.cheapestListing!;
  const price = getNumericPrice(listing.price ?? null);
  if (price == null) {
    return "I wasn't able to read clear prices for the current results.";
  }

  const label =
    best.product.displayName || best.product.name || "this product";
  const storeName =
    (typeof listing.storeName === "string" && listing.storeName) ||
    "one of the stores";
  const currency = listing.currency ? ` ${listing.currency}` : "";

  const contextParts: string[] = [];
  if (searchQuery) contextParts.push(`for "${searchQuery}"`);
  if (location) contextParts.push(`for you in ${location}`);
  const contextStr =
    contextParts.length > 0 ? ` ${contextParts.join(" ")}` : "";

  return `Based on the current results${contextStr}, the lowest price ${scopeLabel} for ${label} is around ${price}${currency} at ${storeName}.`;
}

function buildBestValueAnswer(params: {
  products: Product[];
  searchQuery?: string;
  location?: string;
  favoriteIds?: Set<string>;
}): string {
  const { products, searchQuery, location, favoriteIds } = params;

  if (!products.length) {
    return "I don't see any products in the current results. Try running a search first.";
  }

  type Scored = {
    product: Product;
    listing: Listing;
    price: number;
    score: number;
    isFavorite: boolean;
  };

  const scored: Scored[] = [];

  for (const p of products) {
    const cheapest = getCheapestListing(p);
    if (!cheapest) continue;
    const price = getNumericPrice(cheapest.price ?? null);
    if (price == null || price <= 0) continue;

    const storeId =
      (cheapest.storeId as string | null | undefined) ?? null;
    const storePref = getStorePreferenceScore(storeId, location);

    const ratingRaw = (p as any).rating;
    const rating =
      typeof ratingRaw === "number" && Number.isFinite(ratingRaw)
        ? ratingRaw
        : null;
    const reviewsRaw = (p as any).reviewCount;
    const reviewCount =
      typeof reviewsRaw === "number" && Number.isFinite(reviewsRaw)
        ? reviewsRaw
        : null;

    const ratingComponent = rating != null ? rating : 3; // assume neutral if unknown
    const reviewBoost = reviewCount != null ? Math.min(reviewCount, 200) / 200 : 0;

    const score =
      (ratingComponent * 0.7 + reviewBoost * 0.2 + (storePref + 1) * 0.3) /
      Math.log(price + 10);

    const isFavorite =
      !!favoriteIds && p.id != null && favoriteIds.has(String(p.id));

    scored.push({ product: p, listing: cheapest, price, score, isFavorite });
  }

  if (!scored.length) {
    return "I couldn't find any products with clear prices to compare for value.";
  }

  scored.sort((a, b) => b.score - a.score);

  const bestOverall = scored[0];
  const bestFavorite = scored.find((s) => s.isFavorite) ?? null;

  const overallLabel =
    bestOverall.product.displayName || bestOverall.product.name || "one option";
  const overallStore =
    (typeof bestOverall.listing.storeName === "string" &&
      bestOverall.listing.storeName) || "one of the stores";
  const overallCurrency = bestOverall.listing.currency
    ? ` ${bestOverall.listing.currency}`
    : "";

  const contextParts: string[] = [];
  if (searchQuery) contextParts.push(`for "${searchQuery}"`);
  if (location) contextParts.push(`for you in ${location}`);
  const contextStr =
    contextParts.length > 0 ? ` ${contextParts.join(" ")}` : "";

  const lines: string[] = [];
  lines.push(
    `Looking at the current results${contextStr}, this looks like the best value option overall:
- ${overallLabel} from ${overallStore} for about ${bestOverall.price}${overallCurrency}.`,
  );

  if (bestFavorite) {
    const favLabel =
      bestFavorite.product.displayName ||
      bestFavorite.product.name ||
      "one of your favorites";
    const favStore =
      (typeof bestFavorite.listing.storeName === "string" &&
        bestFavorite.listing.storeName) || "one of the stores";
    const favCurrency = bestFavorite.listing.currency
      ? ` ${bestFavorite.listing.currency}`
      : "";

    lines.push(
      `Among your favorites, ${favLabel} from ${favStore} at about ${bestFavorite.price}${favCurrency} looks like a particularly good value.`,
    );
  }

  lines.push(
    "This isn't a perfect ranking, but it balances price, store preference, and any ratings or reviews that are available.",
  );

  return lines.join("\n");
}

function buildFilterAnswer(params: {
  products: Product[];
  questionText: string;
  searchQuery?: string;
  location?: string;
}): string {
  const { products, questionText, searchQuery, location } = params;

  if (!products.length) {
    return "I don't see any products in the current results. Try running a search first.";
  }

  const maxBudget = extractMaxBudget(questionText);
  const storageTokens = extractStorageTokens(questionText);
  const brandTokens = extractBrandTokens(questionText);

  const constraints: ConstraintSummary = {
    maxBudget,
    storageTokens,
    brandTokens,
  };

  const ranked = rankAndFilterProducts(products, constraints, location);

  if (!ranked.length) {
    return "With the results I currently see, I can't find any products that match those filters.";
  }

  const top = ranked.slice(0, 3);

  const contextParts: string[] = [];
  if (searchQuery) contextParts.push(`for "${searchQuery}"`);
  if (location) contextParts.push(`for you in ${location}`);
  const contextStr =
    contextParts.length > 0 ? ` ${contextParts.join(" ")}` : "";

  const lines: string[] = [];

  lines.push(
    `I looked${contextStr} for products in the current results that match your filters. Here are a few that stand out:`,
  );

  if (maxBudget !== null) {
    lines.push(
      `- Budget: up to about ${maxBudget} (same currency as shown in the prices).`,
    );
  }
  if (storageTokens.length > 0) {
    lines.push(
      `- Storage keywords: ${storageTokens
        .map((t) => t.toUpperCase())
        .join(", ")}.`,
    );
  }
  if (brandTokens.length > 0) {
    lines.push(
      `- Brand keywords: ${brandTokens.map((b) => `"${b}"`).join(", ")}.`,
    );
  }

  top.forEach((rp, index) => {
    const p = rp.product;
    const l = rp.cheapestListing!;
    const price = getNumericPrice(l.price ?? null);
    if (price == null) return;

    const label = p.displayName || p.name || "One option";
    const brandPart = p.brand ? ` (${p.brand})` : "";
    const storePart = l.storeName ? ` at ${l.storeName}` : "";
    const currency = l.currency ? ` ${l.currency}` : "";

    lines.push(
      `${index + 1}. ${label}${brandPart}${storePart} for about ${price}${currency}.`,
    );
  });

  if (ranked.length > top.length) {
    lines.push(
      `There are more matches as well – try tightening or loosening your filters if you want different options.`,
    );
  }

  return lines.join("\n");
}

function buildSummaryAnswer(params: {
  products: Product[];
  searchQuery?: string;
  location?: string;
}): string {
  const { products, searchQuery, location } = params;

  if (!products.length) {
    return "I don't see any products in the current results. Try running a search first.";
  }

  const storeSet = new Set<string>();
  let globalCheapest: Listing | null = null;
  let globalCheapestProduct: Product | null = null;

  for (const p of products) {
    const listings = Array.isArray(p.listings) ? p.listings : [];
    for (const l of listings) {
      const price = getNumericPrice(l?.price ?? null);
      if (price == null) continue;

      const storeName =
        (typeof l.storeName === "string" && l.storeName) || null;
      if (storeName) {
        storeSet.add(storeName);
      }

      if (!globalCheapest) {
        globalCheapest = l;
        globalCheapestProduct = p;
        continue;
      }

      const currentCheapestPrice = getNumericPrice(
        globalCheapest?.price ?? null,
      );
      if (currentCheapestPrice == null || price < currentCheapestPrice) {
        globalCheapest = l;
        globalCheapestProduct = p;
      }
    }
  }

  const totalProducts = products.length;

  const contextParts: string[] = [];
  if (searchQuery) contextParts.push(`for "${searchQuery}"`);
  if (location) contextParts.push(`for you in ${location}`);
  const contextStr =
    contextParts.length > 0 ? ` ${contextParts.join(" ")}` : "";

  const lines: string[] = [];

  lines.push(
    `You currently have ${totalProducts} product${
      totalProducts === 1 ? "" : "s"
    } across ${storeSet.size} store${storeSet.size === 1 ? "" : "s"}${contextStr}.`,
  );

  if (globalCheapest && globalCheapestProduct) {
    const cheapestPrice = getNumericPrice(globalCheapest.price ?? null);
    const storeName =
      (typeof globalCheapest.storeName === "string" &&
        globalCheapest.storeName) || "one of the stores";
    const productLabel =
      globalCheapestProduct.displayName ||
      globalCheapestProduct.name ||
      "one of the products";
    const currency = globalCheapest.currency
      ? ` ${globalCheapest.currency}`
      : "";

    if (cheapestPrice != null) {
      lines.push(
        `The absolute cheapest thing I see is ${productLabel} from ${storeName} at around ${cheapestPrice}${currency}.`,
      );
    }
  }

  lines.push(
    'You can ask me things like "Cheapest option here?", "Which is the best value?", or "Show me options under 3000 RON".',
  );

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    let body: AssistantRequestBody | null = null;
    try {
      body = (await req.json()) as AssistantRequestBody;
    } catch {
      body = null;
    }

    if (!body || !Array.isArray(body.products) || !Array.isArray(body.messages)) {
      return NextResponse.json<AssistantResponseBody>(
        {
          ok: false,
          answer: "I couldn't understand the request.",
        },
        { status: 400 },
      );
    }

    const products: Product[] = Array.isArray(body.products)
      ? (body.products as Product[])
      : [];

    const messages = body.messages.filter(
      (m): m is AssistantMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    );

    const searchQuery: string | undefined =
      typeof body.query === "string" && body.query.trim().length > 0
        ? body.query.trim()
        : undefined;
    const location: string | undefined =
      typeof body.location === "string" && body.location.trim().length > 0
        ? body.location.trim()
        : undefined;
    const selectedProductId: string | null | undefined =
      typeof body.selectedProductId === "string" || body.selectedProductId === null
        ? body.selectedProductId
        : undefined;
    const favoriteIdsSet = new Set(
      Array.isArray(body.favoriteIds)
        ? body.favoriteIds.filter((id): id is string => typeof id === "string")
        : [],
    );

    const lastUserMessage = getLastUserMessage(messages);
    const questionText = lastUserMessage?.content?.trim() ?? "";

    if (!questionText) {
      return NextResponse.json<AssistantResponseBody>({
        ok: true,
        answer:
          'Ask about the cheapest options, best value, or filters for the current results (for example, "Show me options under 3000 RON").',
      });
    }

    if (!products.length) {
      return NextResponse.json<AssistantResponseBody>({
        ok: true,
        answer:
          "I don't see any products in the current results. Run a search first, then ask me about those results.",
      });
    }

    const intent = detectIntent(questionText);

    let answer: string;

    if (intent === "cheapest") {
      answer = buildCheapestAnswer({
        products,
        questionText,
        searchQuery,
        location,
        selectedProductId,
        favoriteIds: favoriteIdsSet,
      });
    } else if (intent === "best_value") {
      answer = buildBestValueAnswer({
        products,
        searchQuery,
        location,
        favoriteIds: favoriteIdsSet,
      });
    } else if (intent === "filter") {
      answer = buildFilterAnswer({
        products,
        questionText,
        searchQuery,
        location,
      });
    } else {
      answer = buildSummaryAnswer({
        products,
        searchQuery,
        location,
      });
    }

    return NextResponse.json<AssistantResponseBody>({
      ok: true,
      answer,
    });
  } catch (error) {
    console.error("Assistant API error:", error);
    return NextResponse.json<AssistantResponseBody>(
      {
        ok: false,
        answer:
          "Something went wrong while analyzing the current results. Please try again.",
      },
      { status: 500 },
    );
  }
}
