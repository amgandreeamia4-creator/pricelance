// src/app/admin/catalog-audit/page.tsx
// Admin catalog QA / audit page.
// Shows category statistics and uncategorized products.
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CategoryStat = {
  category: string | null;
  count: number;
};

type CategorySubcategoryStat = {
  category: string | null;
  subcategory: string | null;
  count: number;
};

type UncategorizedProduct = {
  id: string;
  name: string;
  displayName?: string | null;
  brand?: string | null;
  source?: string | null;
  externalId?: string | null;
  createdAt: Date;
};

/**
 * Fetch product counts grouped by category.
 */
async function fetchCategoryStats(): Promise<CategoryStat[]> {
  try {
    // Fetch all products with category data
    const products = await prisma.product.findMany({
      select: { category: true },
    });

    // Aggregate counts in JavaScript
    const categoryMap = new Map<string | null, number>();
    for (const product of products) {
      const category = product.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }

    // Convert to array and sort by count desc
    const stats = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return stats;
  } catch (err) {
    console.error("[catalog-audit] Failed to fetch category stats:", err);
    return [];
  }
}

/**
 * Fetch product counts grouped by category and subcategory.
 * NOTE: Subcategory field doesn't exist in Product model yet, so return empty array.
 */
async function fetchCategorySubcategoryStats(): Promise<CategorySubcategoryStat[]> {
  return [];
}

/**
 * Fetch first 50 products where category IS NULL.
 */
async function fetchUncategorizedProducts(): Promise<UncategorizedProduct[]> {
  try {
    const results = await prisma.product.findMany({
      where: { category: null },
      select: {
        id: true,
        name: true,
        displayName: true,
        brand: true,
        source: true,
        externalId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return results as UncategorizedProduct[];
  } catch (err) {
    console.error("[catalog-audit] Failed to fetch uncategorized products:", err);
    return [];
  }
}

export default async function CatalogAuditPage() {
  const [categoryStats, categorySubcategoryStats, uncategorizedProducts] = await Promise.all([
    fetchCategoryStats(),
    fetchCategorySubcategoryStats(),
    fetchUncategorizedProducts(),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Catalog QA / Audit</h1>
          <p className="mt-1 text-sm text-slate-400">
            Category statistics and uncategorized products for quality assurance.
          </p>
        </header>

        {/* Section 1: Products by Category */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Products by Category
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Product counts grouped by category. Null values indicate uncategorized products.
          </p>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-3 text-center text-xs text-slate-500"
                    >
                      No category data yet.
                    </td>
                  </tr>
                ) : (
                  categoryStats.map((row) => (
                    <tr
                      key={row.category ?? "null"}
                      className="border-t border-slate-800/80"
                    >
                      <td className="px-3 py-2 text-slate-200">
                        {row.category ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {row.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Products by Category + Subcategory */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Products by Category + Subcategory
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Product counts grouped by category and subcategory combination.
          </p>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    Subcategory
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide text-right">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {categorySubcategoryStats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-3 text-center text-xs text-slate-500"
                    >
                      Subcategory statistics are disabled for now because the Product model does not have a subcategory field yet.
                    </td>
                  </tr>
                ) : (
                  categorySubcategoryStats.map((row) => (
                    <tr
                      key={`${row.category ?? "null"}-${row.subcategory ?? "null"}`}
                      className="border-t border-slate-800/80"
                    >
                      <td className="px-3 py-2 text-slate-200">
                        {row.category ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {row.subcategory ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {row.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Uncategorized Products */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Uncategorized Products (category IS NULL, first 50)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Products without category assignment, ordered by creation date (newest first).
          </p>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    ID
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    Brand
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    Source
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    External ID
                  </th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wide">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {uncategorizedProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-3 text-center text-xs text-slate-500"
                    >
                      No uncategorized products found.
                    </td>
                  </tr>
                ) : (
                  uncategorizedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-t border-slate-800/80"
                    >
                      <td className="px-3 py-2 font-mono text-slate-100">
                        {product.id}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {product.displayName || product.name}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {product.brand ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {product.source ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-100">
                        {product.externalId ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-100">
                        {product.createdAt.toISOString().split('T')[0]}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {uncategorizedProducts.length === 50 && (
            <p className="mt-2 text-xs text-slate-400">
              Showing first 50 uncategorized products. There may be more.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
