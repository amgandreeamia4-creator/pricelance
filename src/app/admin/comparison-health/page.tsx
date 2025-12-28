import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [productCount, listingCount] = await Promise.all([
    prisma.product.count(),
    prisma.listing.count(),
  ]);

  const productsWithCounts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      brand: true,
      _count: {
        select: {
          listings: true,
        },
      },
    },
  });

  let with0 = 0;
  let with1 = 0;
  let with2plus = 0;

  for (const p of productsWithCounts) {
    const c = p._count.listings;
    if (c === 0) with0++;
    else if (c === 1) with1++;
    else with2plus++;
  }

  const multiOfferProducts = productsWithCounts
    .filter((p) => p._count.listings >= 2)
    .sort((a, b) => b._count.listings - a._count.listings)
    .slice(0, 50);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold">DB Comparison Health</h1>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Total products</div>
            <div className="text-xl font-bold">{productCount}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Total listings</div>
            <div className="text-xl font-bold">{listingCount}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Products with 0 offers</div>
            <div className="text-xl font-bold">{with0}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Products with 2+ offers</div>
            <div className="text-xl font-bold">{with2plus}</div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Top products with 2+ offers</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Brand</th>
                  <th className="px-3 py-2"># offers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {multiOfferProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2">
                      {p.displayName ?? p.name}
                    </td>
                    <td className="px-3 py-2">{p.brand ?? '-'}</td>
                    <td className="px-3 py-2">{p._count.listings}</td>
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
