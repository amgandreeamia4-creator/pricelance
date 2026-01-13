"use client";

// src/app/results/page.tsx
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProductList from "@/components/ProductList";

// Types matching the combined search API response
type ProductResponse = {
  id: string;
  name: string;
  displayName: string | null;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
  listings: {
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
  }[];
};

type CombinedSearchResult = {
  query: string;
  limit: number;
  db: {
    products: ProductResponse[];
    total: number;
    page: number;
    perPage: number;
  };
  ebay: {
    total: number;
    items: EbayListing[];
  };
};

type EbayListing = {
  source: "ebay";
  marketplaceId: string;
  externalId: string;
  title: string;
  price: number | null;
  currency: string | null;
  url: string | null;
  imageUrl?: string | null;
  sellerName?: string | null;
};

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawQuery = (searchParams.get("q") || "").trim();
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 48;

  const [searchResult, setSearchResult] = useState<CombinedSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to home if no query provided
  useEffect(() => {
    if (!rawQuery) {
      router.push("/");
      return;
    }
  }, [rawQuery, router]);

  // Fetch combined search results
  useEffect(() => {
    if (!rawQuery) return;

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Call the existing combined search API endpoint
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000"}/api/search/with-ebay?q=${encodeURIComponent(rawQuery)}&limit=${limit}`,
          {
            method: "GET",
            cache: "no-store", // Ensure fresh results
          }
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const result = await response.json();
        setSearchResult(result);
      } catch (err) {
        console.error("Results page search error:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [rawQuery, limit]);

  if (!rawQuery) {
    return null; // Will redirect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Searching for "{rawQuery}"...
            </h1>
          </div>
          <div className="w-full text-center py-10 text-sm text-muted-foreground">
            Loading products...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Search Error
            </h1>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
          <div className="text-center">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!searchResult) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              No Results
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              No results found for "{rawQuery}".
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Results for "{searchResult?.query ?? 'search'}"
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Found {searchResult?.db?.total ?? 0} products from stores
            {searchResult?.ebay?.total != null && searchResult?.ebay?.total > 0 &&
            ` and ${searchResult?.ebay?.total} from eBay`}
          </p>
        </div>

        {/* Store Products */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Store Products
          </h2>
          <ProductList
            products={searchResult?.db?.products ?? []}
            selectedProductId={null}
            onSelectProduct={() => {}}
            favoriteIds={[]}
            onToggleFavorite={() => {}}
            isLoading={false}
          />
        </div>

        {/* eBay Products */}
        {searchResult?.ebay?.items?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              eBay Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(searchResult?.ebay?.items ?? []).map((item) => (
                <div
                  key={item.externalId}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex gap-4">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 h-16 object-contain rounded bg-slate-100 dark:bg-slate-700"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2 mb-2">
                        {item.title}
                      </h3>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                        {item.price ? (
                          `${item.price.toFixed(2)} ${item.currency}`
                        ) : (
                          "See price on eBay"
                        )}
                      </div>
                      <a
                        href={item.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View on eBay →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Search
          </Link>
        </div>
      </div>
    </div>
  );
}
