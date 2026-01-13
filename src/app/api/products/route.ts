import { NextRequest, NextResponse } from "next/server";
import { searchDbProducts } from "@/lib/searchProducts";
import type { CategoryKey } from "@/config/categoryFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SortKey = "relevance" | "price-asc" | "price-desc";

function parseNumberParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const q = searchParams.get("q") ?? "";

  const rawCategory = searchParams.get("category");
  const rawSubcategory = searchParams.get("subcategory");
  const rawStore = searchParams.get("store");
  const rawSort = searchParams.get("sort");

  const category = (rawCategory ?? null) as CategoryKey | null;
  const subcategory = rawSubcategory ?? "";
  const store = rawStore ?? "";
  const sort = (rawSort ?? undefined) as SortKey | undefined;

  const page = parseNumberParam(searchParams.get("page"), 1);
  const perPage = parseNumberParam(searchParams.get("perPage"), 20);

  const startedAt = Date.now();

  const ctx = {
    q,
    category,
    subcategory,
    store,
    sort,
    page,
    perPage,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
  };

  console.log("[/api/products] GET start", ctx);

  try {
    const result = await searchDbProducts({
      query: q,
      category,
      subcategory,
      store,
      sort,
      page,
      perPage,
    });

    const elapsed = Date.now() - startedAt;

    console.log("[/api/products] GET success", {
      ...ctx,
      elapsedMs: elapsed,
      productCount: Array.isArray(result.products)
        ? result.products.length
        : null,
    });

    return NextResponse.json(result);
  } catch (error) {
    const elapsed = Date.now() - startedAt;

    console.error("[/api/products] GET error", {
      ...ctx,
      elapsedMs: elapsed,
      error,
    });

    return NextResponse.json(
      {
        products: [],
        total: 0,
        page,
        perPage,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}