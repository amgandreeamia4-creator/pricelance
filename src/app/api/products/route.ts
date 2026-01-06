import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isListingFromDisabledNetwork } from '@/config/affiliateNetworks';
import { CATEGORY_SYNONYMS, type CategoryKey } from '@/config/categoryFilters';

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

    const query = (searchParams.get('q') ?? '').trim();
    const categoryKeyParam = searchParams.get('category') as CategoryKey | null;
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

    // Build Prisma where object with category synonyms
    const where: any = { AND: [] as any[] };

    if (query) {
      where.AND.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    if (categoryKeyParam && CATEGORY_SYNONYMS[categoryKeyParam]) {
      const synonyms = CATEGORY_SYNONYMS[categoryKeyParam];

      where.AND.push({
        OR: synonyms.flatMap((term) => [
          { category: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { displayName: { contains: term, mode: 'insensitive' } },
        ]),
      });
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
      where: where.AND.length ? where : undefined,
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