import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
  const prices = product.listings
    .map((l) => (typeof l.price === 'number' ? l.price : Infinity));
  return Math.min(...prices);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get('q') ?? '').trim();
    const store = searchParams.get('store') || undefined;
    const sort = searchParams.get('sort') || 'relevance'; // relevance | price-asc | price-desc
    const pageParam = searchParams.get('page') ?? '1';
    const perPageParam = searchParams.get('perPage') ?? '24';

    const page = Math.max(1, Number.isNaN(Number(pageParam)) ? 1 : parseInt(pageParam, 10));
    const perPageRaw = Number.isNaN(Number(perPageParam)) ? 24 : parseInt(perPageParam, 10);
    const perPage = Math.min(Math.max(perPageRaw, 1), 48);
    const skip = (page - 1) * perPage;

    // --- WHERE: search across ALL products, ALL categories ---
    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (store) {
      // Filter to products that have at least one listing from this store
      where.listings = {
        some: {
          storeId: store,
        },
      };
    }

    // Total for pagination
    const total = await prisma.product.count({ where });

    // Base query: include all listings; no clever filtering here
    const dbProducts = await prisma.product.findMany({
      where,
      include: {
        listings: true,
      },
      skip,
      take: perPage,
    });

    // --- In-memory sorting based on best price, if requested ---
    let sorted = [...dbProducts];

    if (sort === 'price-asc') {
      sorted.sort((a, b) => getBestPrice(a) - getBestPrice(b));
    } else if (sort === 'price-desc') {
      sorted.sort((a, b) => getBestPrice(b) - getBestPrice(a));
    } else {
      // "relevance": keep DB order; we can improve later if needed
    }

    const products: ProductResponse[] = sorted.map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      brand: p.brand,
      imageUrl: p.imageUrl,
      category: (p as any).category ?? null,
      listings: (p.listings || []).map((l: any) => ({
        id: l.id,
        storeId: l.storeId ?? null,
        storeName: l.storeName ?? null,
        price: l.price,
        currency: l.currency ?? null,
        url: l.url ?? l.productUrl ?? l.affiliateUrl ?? null,
        affiliateProvider: l.affiliateProvider ?? null,
        source: l.source ?? null,
        fastDelivery: l.fastDelivery ?? null,
      })),
    }));

    return NextResponse.json({
      products,
      total,
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