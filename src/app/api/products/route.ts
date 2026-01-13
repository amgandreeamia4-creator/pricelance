// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchDbProducts } from "@/lib/searchProducts";
import { type CategoryKey } from "@/config/categoryFilters";

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

    const page = Math.max(
      1,
      Number.isNaN(Number(pageParam)) ? 1 : parseInt(pageParam, 10)
    );
    const perPageRaw = Number.isNaN(Number(perPageParam))
      ? 24
      : parseInt(perPageParam, 10);
    const perPage = Math.min(Math.max(perPageRaw, 1), 48);

    const result = await searchDbProducts({
      query,
      category: categoryKeyParam,
      subcategory,
      store,
      sort: sort as "relevance" | "price-asc" | "price-desc",
      page,
      perPage,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/products] Error:", err);
    return NextResponse.json(
      { products: [], error: "Internal server error" },
      { status: 500 }
    );
  }
}