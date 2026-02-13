// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isListingFromDisabledNetwork } from "@/config/affiliateNetworks";
import { cookies } from "next/headers";
import {
  dbCategoryFromSlug,
  getCategoryByLabel,
  type CanonicalCategoryLabel,
} from "@/config/categories";

type ListingResponse = {
  id: string;
  storeId: string | null;
  storeName: string | null;
  price: number | null;
  currency: string | null;
  url: string | null;
  affiliateProvider: string | null;
  source: string | null;
  fastDelivery: boolean | null;
  imageUrl: string | null;
};

type ProductResponse = {
  id: string;
  name: string;
  displayName: string | null;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
  listings: ListingResponse[];
};

// Try to extract a human-friendly domain from a URL
function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, "");
    return host;
  } catch {
    return null;
  }
}

// Given a listing, try to infer a nice store name
function deriveStoreName(listing: any): string | null {
  // 1) Existing storeName in DB wins
  if (listing.storeName && typeof listing.storeName === "string") {
    return listing.storeName;
  }

  // 2) Fallback: derive from URL domain
  const url = listing.url ?? listing.productUrl ?? listing.affiliateUrl;
  const domain = extractDomain(url);
  if (domain) return domain;

  return null;
}

// Compute best (lowest) price from a list of listings
function computeBestPrice(listings: { price: number | null }[]): number | null {
  let best = Infinity;
  for (const l of listings) {
    if (typeof l.price === "number" && !Number.isNaN(l.price)) {
      if (l.price < best) best = l.price;
    }
  }
  return best === Infinity ? null : best;
}

// Normalize various DB price types (number, string, Decimal) into a JS number
function normalizePrice(rawPrice: any): number | null {
  if (rawPrice === null || rawPrice === undefined) return null;

  let numeric: number;

  if (typeof rawPrice === "number") {
    numeric = rawPrice;
  } else if (typeof rawPrice === "object" && rawPrice !== null) {
    // Handle Prisma.Decimal or similar objects with toNumber()
    const maybeDecimal = rawPrice as {
      toNumber?: () => number;
      toString?: () => string;
    };
    if (typeof maybeDecimal.toNumber === "function") {
      numeric = maybeDecimal.toNumber();
    } else if (typeof maybeDecimal.toString === "function") {
      numeric = Number(maybeDecimal.toString());
    } else {
      numeric = Number(rawPrice as any);
    }
  } else {
    // string or other primitive
    numeric = Number(rawPrice);
  }

  return Number.isFinite(numeric) ? numeric : null;
}

// ---------------------------------------------------------------------
// Helper for sorting by lowest price
// ---------------------------------------------------------------------
function getBestPrice(product: { listings: { price: number | null }[] }) {
  if (!product.listings || product.listings.length === 0) return Infinity;
  const prices = product.listings.map((l) =>
      typeof l.price === "number" ? l.price : Infinity,
  );
  return Math.min(...prices);
}

// ---------------------------------------------------------------------
// PHONE FILTERING LOGIC
// ---------------------------------------------------------------------

const PHONE_POSITIVE_KEYWORDS = [
  "telefon",
  "telefoane",
  "telefon mobil",
  "smartphone",
  "smartfon",
  "iphone",
  "android",
  "galaxy",
  "pixel",
  "redmi",
  "xiaomi",
  "samsung",
  "huawei",
  "honor",
  "oneplus",
  "realme",
  "nokia",
  "moto",
  "motorola",
  "oppo",
  "vivo",
];

const PHONE_NEGATIVE_KEYWORDS = [
  // Cases & protection
  "husa",
  "husă",
  "huse",
  "case",
  "cover",
  "carcasa",
  "carcasă",
  "bumper",
  "folie",
  "screen protector",
  "protector",
  "geam",
  "glass",
  // Audio & misc accessories
  "casti",
  "căști",
  "headphone",
  "headphones",
  "headset",
  "earbuds",
  "earphones",
  "handsfree",
  "hands-free",
  "micro sistem",
  "sistem audio",
  "speaker",
  "speakers",
  "boxa",
  "boxă",
  "boxe",
  "soundbar",
  "sound bar",
  // Power & misc
  "incarcator",
  "încărcător",
  "charger",
  "powerbank",
  "cablu",
  "cabluri",
  "adaptor",
  "adapter",
  "dock",
  "suport",
  "holder",
  "stand",
  "mount",
];

// Very dumb-but-safe: try to detect real phones.
function isRealPhone(product: ProductResponse): boolean {
  const text = `${product.name || ""} ${product.displayName || ""}`.toLowerCase();
  const category = (product.category || "").toLowerCase();

  const strongCategoryHints = ["telefon", "smartphone", "telefon mobil"];
  const strongCategory = strongCategoryHints.some((kw) => category.includes(kw));

  const hasNegative = PHONE_NEGATIVE_KEYWORDS.some((kw) =>
      text.includes(kw.toLowerCase()),
  );
  if (hasNegative) return false;

  const hasPositive = PHONE_POSITIVE_KEYWORDS.some((kw) =>
      text.includes(kw.toLowerCase()),
  );

  if (strongCategory) return true;
  return hasPositive;
}

const LAPTOP_NEGATIVE_KEYWORDS = [
  // Power / charging
  "baterie",
  "baterii",
  "battery",
  "power bank",
  "powerbank",
  "încărcător",
  "incarcator",
  "charger",
  "alimentator",
  // Adapters / docks
  "adaptor",
  "adapter",
  "dock",
  "docking",
  "station",
  // Generic accessories / bags
  "husă",
  "husa",
  "case",
  "geantă",
  "geanta",
  "bag",
  "backpack",
];

function isRealLaptop(product: ProductResponse): boolean {
  const text = `${product.name || ""} ${product.displayName || ""}`.toLowerCase();

  const hasNegative = LAPTOP_NEGATIVE_KEYWORDS.some((kw) =>
      text.includes(kw.toLowerCase()),
  );

  // For now we only drop clear negatives (accessories).
  // Everything else stays in the Laptops category.
  return !hasNegative;
}

// ---------------------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = (searchParams.get("q") ?? "").trim();
    const categoryKeyParam = searchParams.get("category") as string | null;
    const rawCategorySlug = searchParams.get("categorySlug") as string | null;
    const subcategory = searchParams.get("subcategory") ?? undefined;

    // Normalize category: support both legacy 'category' and new 'categorySlug' params
    let effectiveCategoryLabel: CanonicalCategoryLabel | null = null;

    if (rawCategorySlug) {
      // Map slug to canonical label using single source helper
      const canonicalLabel = dbCategoryFromSlug(rawCategorySlug);
      if (canonicalLabel) {
        effectiveCategoryLabel = canonicalLabel;
        console.log("[api/products] Resolved categorySlug to label:", {
          slug: rawCategorySlug,
          resolvedLabel: canonicalLabel,
        });
      } else {
        // Unknown slug - return empty results
        console.warn("[api/products] Unknown categorySlug:", rawCategorySlug);
        return NextResponse.json({
          products: [],
          total: 0,
          page: 1,
          perPage: 24,
        });
      }
    } else if (categoryKeyParam) {
      // Legacy: direct category label provided
      const node = getCategoryByLabel(categoryKeyParam);
      if (node) effectiveCategoryLabel = node.label;
    }

    const store = searchParams.get("store") || undefined;
    const sort = searchParams.get("sort") || "relevance"; // relevance | price-asc | price-desc
    const pageParam = searchParams.get("page") ?? "1";
    const perPageParam =
        searchParams.get("perPage") ?? searchParams.get("limit") ?? "24";
    const locationParam = searchParams.get("location") || undefined;

    const page = Math.max(
        1,
        Number.isNaN(Number(pageParam)) ? 1 : parseInt(pageParam, 10),
    );
    const perPageRaw = Number.isNaN(Number(perPageParam))
        ? 24
        : parseInt(perPageParam, 10);
    const perPage = Math.min(Math.max(perPageRaw, 1), 50);
    const skip = (page - 1) * perPage;

    // ========================================
    // Step 1: Build productWhere (Product-level filters only)
    // ========================================
    const productWhereAndClauses: any[] = [];

    if (query) {
      productWhereAndClauses.push({
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { displayName: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      });
    }

    if (effectiveCategoryLabel) {
      // EXACT category equality
      productWhereAndClauses.push({
        category: { equals: effectiveCategoryLabel },
      });
    }

    if (subcategory) {
      productWhereAndClauses.push({ subcategory });
    }

    const productWhere = productWhereAndClauses.length
        ? { AND: productWhereAndClauses }
        : undefined;

    // ========================================
    // Step 2: Build listingWhere (Listing-level filters only)
    // ========================================
    // IMPORTANT: we intentionally do NOT force `inStock: true` here,
    // because many legacy/manual listings have inStock = null/false.
    // Requiring true was wiping out valid offers on the homepage.
    const listingWhere: any = {};

    if (store) {
      listingWhere.storeId = store;
    }

    // Read user location from cookie (opt-in location preference)
    const userLocation =
      (await cookies()).get("userLocation")?.value?.toLowerCase() || undefined;
    const effectiveLocation = locationParam || userLocation;

    // Location filtering: opt-in only (if location set, prioritize local but show international)
    if (effectiveLocation && effectiveLocation.trim()) {
      listingWhere.OR = [
        {
          countryCode: { equals: effectiveLocation, mode: "insensitive" }, // Local
        },
        { countryCode: null }, // Unknown location
        { countryCode: { not: effectiveLocation } }, // International
      ];
    }
    // If no location set: no countryCode filter (show all worldwide)

    // ========================================
    // Step 3: Count total products using productWhere ONLY
    // ========================================
    const total = await prisma.product.count({ where: productWhere });

    // ========================================
    // Step 4: Fetch products using productWhere, with listings filtered via include
    // ========================================
    const dbProducts = (await prisma.product.findMany({
      where: productWhere,
      skip: skip,
      take: perPage,
      include: {
        listings: {
          where: listingWhere,
          orderBy: [{ price: "asc" }], // Lowest price first
        },
      },
    })) as any[];

    // ========================================
    // Step 5: Filter listings based on disabled affiliate networks
    // ========================================
    // TEMP: show ALL listings (affiliate + non-affiliate) on the homepage.
    // We rely on the AFFILIATE badge (based on `affiliateProvider`) to
    // distinguish affiliate offers. Disabled-network filtering will be
    // reintroduced later in a more controlled way.
    const filterListingsForVisibility = (listings: any[]) => {
      return listings;
    };

    // ========================================
    // Step 6: Map to ProductResponse[] (includes are already filtered)
    // ========================================
    const products: ProductResponse[] = dbProducts.map((p: any) => {
      const visibleListingsRaw = filterListingsForVisibility(p.listings ?? []);

      // Normalize listings: clean storeName, url, price
      const normalizedListings: ListingResponse[] = visibleListingsRaw.map(
          (l: any) => {
            const url = l.url ?? l.productUrl ?? l.affiliateUrl ?? null;
            const inferredStoreName = deriveStoreName(l);

            return {
              id: l.id,
              storeId: l.storeId ?? null,
              storeName: inferredStoreName ?? l.storeName ?? null,
              price: normalizePrice(l.price),
              currency: l.currency ?? null,
              url,
              affiliateProvider: l.affiliateProvider ?? null,
              source: l.source ?? null,
              fastDelivery: l.fastDelivery ?? null,
              imageUrl: l.imageUrl ?? null,
            };
          },
      );

      // You can compute best price / offer count if needed later
      const bestPrice = computeBestPrice(normalizedListings);
      const offerCount = normalizedListings.length;
      void bestPrice;
      void offerCount;

      return {
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        brand: p.brand,
        imageUrl: p.imageUrl,
        category: p.category ?? null,
        listings: normalizedListings,
      };
    });

    // Optional category-specific filtering to remove obvious accessories.
    // Use the slug from the query for simple branching.
    let filteredProducts: ProductResponse[] = products;

    if (rawCategorySlug === "phones") {
      filteredProducts = filteredProducts.filter((p) => isRealPhone(p));
    } else if (rawCategorySlug === "laptops") {
      filteredProducts = filteredProducts.filter((p) => isRealLaptop(p));
    }

    // ========================================
    // Step 7: Sort by price if requested
    // ========================================
    let sortedProducts: ProductResponse[] = filteredProducts;

    if (sort === "price-asc") {
      sortedProducts = [...filteredProducts].sort(
          (a, b) => getBestPrice(a) - getBestPrice(b),
      );
    } else if (sort === "price-desc") {
      sortedProducts = [...filteredProducts].sort(
          (a, b) => getBestPrice(b) - getBestPrice(a),
      );
    }
    // else "relevance": keep order from DB / current ordering

    // ========================================
    // Step 8: Debug log and return
    // ========================================
    console.log("[api/products]", {
      categorySlug: rawCategorySlug,
      total,
      productsCount: sortedProducts.length,
    });

    return NextResponse.json({
      products: sortedProducts,
      total,
      page,
      perPage,
    });
  } catch (err) {
    console.error("[GET /api/products] Error:", err);
    return NextResponse.json(
        { products: [], error: "Internal server error" },
        { status: 500 },
    );
  }
}
