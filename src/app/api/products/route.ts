// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isListingFromDisabledNetwork } from "@/config/affiliateNetworks";
import { CATEGORY_SYNONYMS, type CategoryKey } from "@/config/categoryFilters";
import { cookies } from "next/headers";

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

// ---------------------------------------------------------------------
// Helper for sorting by lowest price
// ---------------------------------------------------------------------
function getBestPrice(product: { listings: { price: number | null }[] }) {
  if (!product.listings || product.listings.length === 0) return Infinity;
  const prices = product.listings.map((l) =>
    typeof l.price === "number" ? l.price : Infinity
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
  const strongCategory = strongCategoryHints.some((kw) =>
    category.includes(kw)
  );

  const hasNegative = PHONE_NEGATIVE_KEYWORDS.some((kw) =>
    text.includes(kw.toLowerCase())
  );
  if (hasNegative) return false;

  const hasPositive = PHONE_POSITIVE_KEYWORDS.some((kw) =>
    text.includes(kw.toLowerCase())
  );

  if (strongCategory) return true;
  return hasPositive;
}

// ---------------------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = (searchParams.get("q") ?? "").trim();
    const categoryKeyParam = searchParams.get("category") as CategoryKey | null;
    const subcategory = searchParams.get("subcategory") ?? undefined;
    const store = searchParams.get("store") || undefined;
    const sort = searchParams.get("sort") || "relevance"; // relevance | price-asc | price-desc
    const pageParam = searchParams.get("page") ?? "1";
    const perPageParam = searchParams.get("perPage") ?? "24";
    const locationParam = searchParams.get("location") || undefined;

    const page = Math.max(
      1,
      Number.isNaN(Number(pageParam)) ? 1 : parseInt(pageParam, 10)
    );
    const perPageRaw = Number.isNaN(Number(perPageParam))
      ? 24
      : parseInt(perPageParam, 10);
    const perPage = Math.min(Math.max(perPageRaw, 1), 48);
    const skip = (page - 1) * perPage;

    const isPhonesCategory = categoryKeyParam === "Phones";

    // Build Prisma where object with category synonyms (NO Listing/listings here)
    const where: any = { AND: [] as any[] };

    if (query) {
      where.AND.push({
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { displayName: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      });
    }

    if (categoryKeyParam && CATEGORY_SYNONYMS[categoryKeyParam]) {
      const synonyms = CATEGORY_SYNONYMS[categoryKeyParam];

      where.AND.push({
        OR: synonyms.flatMap((term) => [
          { category: { contains: term, mode: "insensitive" } },
          { name: { contains: term, mode: "insensitive" } },
          { displayName: { contains: term, mode: "insensitive" } },
        ]),
      });
    }

    if (subcategory) {
      where.subcategory = subcategory;
    }

    const effectiveWhere = where.AND.length ? where : undefined;

    // For Phones, pull more rows and filter in memory so phones aren't drowned by cases
    const take = isPhonesCategory ? 300 : perPage;
    const effectiveSkip = isPhonesCategory ? 0 : skip;

    // 1) Fetch products ONLY (no relations)
    const dbProducts = (await prisma.product.findMany({
      where: effectiveWhere,
      skip: effectiveSkip,
      take,
    })) as any[];

    if (dbProducts.length === 0) {
      return NextResponse.json({
        products: [],
        total: 0,
        page,
        perPage,
      });
    }

    // 2) Fetch listings separately, linked by productId and optionally filtered by store/location
    const productIds = dbProducts.map((p) => p.id);

    // Read user location from cookie (opt-in location preference)
    const userLocation = (await cookies()).get('userLocation')?.value?.toLowerCase() || undefined;
    const effectiveLocation = locationParam || userLocation;

    const listingsWhere: any = {
      productId: { in: productIds },
      // Always filter for in-stock items
      inStock: true,
    };

    if (store) {
      listingsWhere.storeId = store;
    }

    // Location filtering: opt-in only (if location set, prioritize local but show international)
    if (effectiveLocation && effectiveLocation.trim()) {
      listingsWhere.OR = [
        { countryCode: { equals: effectiveLocation, mode: 'insensitive' } },  // Local
        { countryCode: null },                                            // Unknown location
        { countryCode: { not: effectiveLocation } }                        // International
      ];
    }
    // If no location set: no countryCode filter (show all worldwide)

    const dbListings = (await prisma.listing.findMany({
      where: listingsWhere,
    })) as any[];

    // 3) Group listings by productId
    const listingsByProductId = new Map<string, any[]>();

    for (const l of dbListings) {
      const pid = l.productId as string;
      const existing = listingsByProductId.get(pid);
      if (existing) {
        existing.push(l);
      } else {
        listingsByProductId.set(pid, [l]);
      }
    }

    // 4) Filter listings based on disabled affiliate networks
    const filterListingsForVisibility = (listings: any[]) => {
      return listings.filter((l) =>
        !isListingFromDisabledNetwork({
          affiliateProvider: l.affiliateProvider,
          affiliateProgram: l.affiliateProgram,
          url: l.url,
        })
      );
    };

    // 5) Map products + listings into ProductResponse[]
    const products: ProductResponse[] = dbProducts.map((p: any) => {
      const rawListings = listingsByProductId.get(p.id) ?? [];
      const visibleListings = filterListingsForVisibility(rawListings);

      return {
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        brand: p.brand,
        imageUrl: p.imageUrl,
        category: p.category ?? null,
        listings: visibleListings.map(
          (l: any): ListingResponse => ({
            id: l.id,
            storeId: l.storeId ?? null,
            storeName: l.storeName ?? null,
            price: l.price,
            currency: l.currency ?? null,
            url: l.url ?? l.productUrl ?? l.affiliateUrl ?? null,
            affiliateProvider: l.affiliateProvider ?? null,
            source: l.source ?? null,
            fastDelivery: l.fastDelivery ?? null,
            imageUrl: l.imageUrl ?? null,
          })
        ),
      };
    });

    // 6) Keep only products that actually have visible offers
    let visibleProducts: ProductResponse[] = products.filter(
      (p) => p.listings.length > 0
    );

    // 7) Sorting based on best price
    if (sort === "price-asc") {
      visibleProducts = [...visibleProducts].sort(
        (a, b) => getBestPrice(a) - getBestPrice(b)
      );
    } else if (sort === "price-desc") {
      visibleProducts = [...visibleProducts].sort(
        (a, b) => getBestPrice(b) - getBestPrice(a)
      );
    }
    // else "relevance": keep order from DB

    // -----------------------------------------------------------------
    // SPECIAL CASE: Phones category – try to show REAL phones first,
    // BUT NEVER return 0 because of our filter.
    // -----------------------------------------------------------------
    if (isPhonesCategory) {
      const phoneOnly = visibleProducts.filter(isRealPhone);

      if (phoneOnly.length >= perPage) {
        visibleProducts = phoneOnly.slice(0, perPage);
      } else if (phoneOnly.length > 0) {
        const leftovers = visibleProducts.filter((p) => !isRealPhone(p));
        const needed = Math.max(0, perPage - phoneOnly.length);
        visibleProducts = phoneOnly.concat(leftovers.slice(0, needed));
      } else {
        // 0 detected phones → FALL BACK, do NOT empty the list
        // visibleProducts stays as-is (cases + misc)
      }
    }

    return NextResponse.json({
      products: visibleProducts,
      total: visibleProducts.length,
      page,
      perPage,
    });
  } catch (err) {
    console.error("[GET /api/products] Error:", err);
    return NextResponse.json(
      { products: [], error: "Internal server error" },
      { status: 500 }
    );
  }
}