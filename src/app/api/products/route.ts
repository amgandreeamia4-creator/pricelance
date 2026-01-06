import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isListingFromDisabledNetwork } from '@/config/affiliateNetworks';
import type { Prisma } from '@prisma/client';

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

type TopCategoryKey =
  | 'laptops'
  | 'phones'
  | 'monitors'
  | 'headphones_audio'
  | 'keyboards_mouse'
  | 'tv_display'
  | 'tablets'
  | 'smartwatches'
  | 'home_garden'
  | 'personal_care'
  | 'small_appliances'
  | 'wellness_supplements'
  | 'gifts_lifestyle'
  | 'books_media'
  | 'toys_games'
  | 'kitchen';

const CATEGORY_FILTERS: Record<TopCategoryKey, Prisma.ProductWhereInput> = {
  laptops: {
    OR: [
      { name: { contains: 'laptop', mode: 'insensitive' } },
      { category: { contains: 'laptop', mode: 'insensitive' } },
    ],
  },
  phones: {
    OR: [
      { name: { contains: 'telefon', mode: 'insensitive' } },
      { name: { contains: 'phone', mode: 'insensitive' } },
      { category: { contains: 'phone', mode: 'insensitive' } },
    ],
  },
  monitors: {
    OR: [
      { name: { contains: 'monitor', mode: 'insensitive' } },
      { category: { contains: 'monitor', mode: 'insensitive' } },
    ],
  },
  headphones_audio: {
    OR: [
      { name: { contains: 'căști', mode: 'insensitive' } },
      { name: { contains: 'casti', mode: 'insensitive' } },
      { name: { contains: 'headphone', mode: 'insensitive' } },
      { category: { contains: 'audio', mode: 'insensitive' } },
    ],
  },
  keyboards_mouse: {
    OR: [
      { name: { contains: 'tastatur', mode: 'insensitive' } },
      { name: { contains: 'keyboard', mode: 'insensitive' } },
      { name: { contains: 'mouse', mode: 'insensitive' } },
    ],
  },
  tv_display: {
    OR: [
      { name: { contains: 'monitor', mode: 'insensitive' } },
      { name: { contains: 'tv ', mode: 'insensitive' } },
      { category: { contains: 'televizor', mode: 'insensitive' } },
    ],
  },
  tablets: {
    OR: [
      { name: { contains: 'tablet', mode: 'insensitive' } },
      { category: { contains: 'tablet', mode: 'insensitive' } },
    ],
  },
  smartwatches: {
    OR: [
      { name: { contains: 'watch', mode: 'insensitive' } },
      { name: { contains: 'ceas', mode: 'insensitive' } },
    ],
  },
  home_garden: {
    OR: [
      { category: { contains: 'home', mode: 'insensitive' } },
      { category: { contains: 'gard', mode: 'insensitive' } },
      { name: { contains: 'decor', mode: 'insensitive' } },
    ],
  },
  personal_care: {
    OR: [
      { category: { contains: 'ingrijire', mode: 'insensitive' } },
      { category: { contains: 'personal care', mode: 'insensitive' } },
      { name: { contains: 'gel de dus', mode: 'insensitive' } },
      { name: { contains: 'shower gel', mode: 'insensitive' } },
    ],
  },
  small_appliances: {
    OR: [
      { category: { contains: 'electrocasnice mici', mode: 'insensitive' } },
      { category: { contains: 'small appliance', mode: 'insensitive' } },
    ],
  },
  wellness_supplements: {
    OR: [
      { category: { contains: 'supliment', mode: 'insensitive' } },
      { category: { contains: 'supplement', mode: 'insensitive' } },
    ],
  },
  gifts_lifestyle: {
    OR: [
      { category: { contains: 'cadouri', mode: 'insensitive' } },
      { category: { contains: 'gift', mode: 'insensitive' } },
    ],
  },
  books_media: {
    OR: [
      { category: { contains: 'cărți', mode: 'insensitive' } },
      { category: { contains: 'carti', mode: 'insensitive' } },
      { category: { contains: 'books', mode: 'insensitive' } },
      { category: { contains: 'media', mode: 'insensitive' } },
    ],
  },
  toys_games: {
    OR: [
      { category: { contains: 'jocuri', mode: 'insensitive' } },
      { category: { contains: 'toys', mode: 'insensitive' } },
      { category: { contains: 'games', mode: 'insensitive' } },
    ],
  },
  kitchen: {
    OR: [
      { category: { contains: 'bucatar', mode: 'insensitive' } },
      { category: { contains: 'kitchen', mode: 'insensitive' } },
      { name: { contains: 'bucatar', mode: 'insensitive' } },
      { name: { contains: 'kitchen', mode: 'insensitive' } },
    ],
  },
};

function getBestPrice(product: { listings: { price: number | null }[] }) {
  if (!product.listings || product.listings.length === 0) return Infinity;
  const prices = product.listings.map((l) =>
    typeof l.price === 'number' ? l.price : Infinity,
  );
  return Math.min(...prices);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get('q') ?? '').trim();
    const categoryKey = searchParams.get('category') as TopCategoryKey | null;
    const categoryFilter = categoryKey && CATEGORY_FILTERS[categoryKey] ? CATEGORY_FILTERS[categoryKey] : undefined;
    const store = searchParams.get('store') || undefined;
    const sort = searchParams.get('sort') || 'relevance'; // relevance | price-asc | price-desc
    const pageParam = searchParams.get('page') ?? '1';
    const perPageParam = searchParams.get('perPage') ?? '24';

    const page = Math.max(
      1,
      Number.isNaN(Number(pageParam)) ? 1 : parseInt(pageParam, 10),
    );
    const perPageRaw = Number.isNaN(Number(perPageParam))
      ? 24
      : parseInt(perPageParam, 10);
    const perPage = Math.min(Math.max(perPageRaw, 1), 48);
    const skip = (page - 1) * perPage;

    // --- WHERE: search across ALL products, ALL categories ---
    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Add category filtering support
    if (categoryFilter) {
      if (q && where.OR) {
        // If both text search and category filter, combine with AND
        where.AND = [
          { OR: where.OR },
          categoryFilter
        ];
        delete where.OR;
      } else {
        // Only category filter
        Object.assign(where, categoryFilter);
      }
    }

    if (store) {
      // Products that have at least one listing from this store
      where.listings = {
        some: {
          storeId: store,
        },
      };
    }

    // Total before visibility filter (good enough for v0, we override with visible length)
    await prisma.product.count({ where });

    const dbProducts = await prisma.product.findMany({
      where,
      include: {
        listings: true,
      },
      skip,
      take: perPage,
    });

    // --- In-memory sorting based on best price, if requested ---
    const sorted = [...dbProducts];

    if (sort === 'price-asc') {
      sorted.sort((a, b) => getBestPrice(a) - getBestPrice(b));
    } else if (sort === 'price-desc') {
      sorted.sort((a, b) => getBestPrice(b) - getBestPrice(a));
    } else {
      // "relevance": keep DB order; can improve later
    }

    // Filter listings based on DISABLED_AFFILIATE_SOURCES configuration
    const filterListingsForVisibility = (listings: any[]) => {
      return listings.filter((l) => !isListingFromDisabledNetwork({
        affiliateProvider: l.affiliateProvider,
        affiliateProgram: l.affiliateProgram,
        url: l.url,
      }));
    };

    const products: ProductResponse[] = sorted.map((p: any) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      brand: p.brand,
      imageUrl: p.imageUrl,
      category: p.category ?? null,
      listings: filterListingsForVisibility(p.listings ?? []).map(
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
          imageUrl: l.imageUrl ?? null, // Include listing image URL
        }),
      ),
    }));

    // keep only products that actually have visible offers
    const visibleProducts = products.filter((p) => p.listings.length > 0);

    return NextResponse.json({
      products: visibleProducts,
      total: visibleProducts.length, // simple & honest for v0
      page,
      perPage,
    });
  } catch (err) {
    console.error('[GET /api/products] Error:', err);
    return NextResponse.json(
      { products: [], error: 'Internal server error' },
      { status: 500 },
    );
  }
}