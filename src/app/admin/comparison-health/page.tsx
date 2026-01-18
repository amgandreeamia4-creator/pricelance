import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type ProductWithOfferCount = {
  id: string;
  name: string;
  displayName: string | null;
  brand: string | null;
  offersCount: number;
};

export default async function ComparisonHealthPage() {
  // Basic totals
  const [productCount, listingCount] = await Promise.all([
    prisma.product.count(),
    prisma.listing.count(),
  ]);

  // Load minimal product fields
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      brand: true,
    },
  });

  // Group listings by productId to get counts,
  // this avoids relying on any Product relation name.
  const listingGroups = await prisma.listing.groupBy({
    by: ["productId"],
    _count: { _all: true },
  });

  const countByProductId = new Map<string, number>();
  (listingGroups as { productId: string; _count: { _all: number } }[]).forEach(
    (g) => {
      countByProductId.set(g.productId, g._count._all);
    }
  );

  const productsWithCounts: ProductWithOfferCount[] = products.map((p: any) => {
    const offersCount = countByProductId.get(p.id) ?? 0;
    return {
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      brand: p.brand,
      offersCount,
    };
  });

  let with0 = 0;
  let with2plus = 0;

  for (const p of productsWithCounts) {
    if (p.offersCount === 0) {
      with0++;
    } else if (p.offersCount >= 2) {
      with2plus++;
    }
  }

  const multiOfferProducts = productsWithCounts
    .filter((p) => p.offersCount >= 2)
    .sort((a, b) => b.offersCount - a.offersCount)
    .slice(0, 50);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold">DB Comparison Health</h1>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 text-slate-900">
            <div className="text-xs text-slate-500">Total products</div>
            <div className="text-xl font-bold">{productCount}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-slate-900">
            <div className="text-xs text-slate-500">Total listings</div>
            <div className="text-xl font-bold">{listingCount}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-slate-900">
            <div className="text-xs text-slate-500">Products with 0 offers</div>
            <div className="text-xl font-bold">{with0}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-slate-900">
            <div className="text-xs text-slate-500">Products with 2+ offers</div>
            <div className="text-xl font-bold">{with2plus}</div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            Top products with 2+ offers
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900/40">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800 text-left text-xs font-semibold text-slate-300">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Brand</th>
                  <th className="px-3 py-2"># offers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {multiOfferProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2">
                      {p.displayName ?? p.name}
                    </td>
                    <td className="px-3 py-2">{p.brand ?? "-"}</td>
                    <td className="px-3 py-2">{p.offersCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
