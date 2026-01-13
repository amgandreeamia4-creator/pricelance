"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchEbayItems, type EbayItem } from "@/lib/ebayFeed";

// Types based on the offers API response
type Product = {
  id: string;
  title: string;
  imageUrl?: string | null;
  minPrice?: number | null;
  currency?: string | null;
};

type Offer = {
  id: string;
  storeName: string;
  price: number;
  currency: string;
  productUrl: string;
  shippingInfo?: string | null;
  badge?: string | null;
};

type OffersResponse = {
  product: Product | null;
  offers: Offer[];
};

// EU countries list for eBay integration
const EU_COUNTRIES = [
  "DE", "FR", "ES", "IT", "NL", "BE", "PL", "AT", "HU", "BG", "GR",
  "PT", "SE", "DK", "FI", "IE", "LU", "MT", "SI", "SK", "EE", "LV", "LT",
  "CY", "CZ", "HR", "RO"
];

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [country, setCountry] = useState("RO");
  const [retryToken, setRetryToken] = useState(0);

  // Product and offers state
  const [product, setProduct] = useState<Product | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);

  // eBay state
  const [ebayItems, setEbayItems] = useState<EbayItem[]>([]);
  const [isLoadingEbay, setIsLoadingEbay] = useState(false);
  const [ebayError, setEbayError] = useState<string | null>(null);

  // Load country from query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const countryParam = urlParams.get("country") || "RO";
      const ebayParam = urlParams.get("ebay");
      setCountry(countryParam);
      setRetryToken(Number(ebayParam) || 0);
    }
  }, []);

  // Fetch product offers
  useEffect(() => {
    if (!productId) return;

    const fetchOffers = async () => {
      setIsLoadingOffers(true);
      setOffersError(null);

      try {
        const response = await fetch(
          `/api/products/${productId}/offers?country=${country}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });

          if (response.status === 404) {
            setOffersError("Product not found in our database");
          } else {
            setOffersError(errorData?.error || `Server error: ${response.status}`);
          }
          return;
        }

        const data: OffersResponse = await response.json();
        setProduct(data.product);
        setOffers(data.offers);
      } catch (error) {
        console.error("Error fetching offers:", error);
        setOffersError("Failed to load product offers. Please try again.");
      } finally {
        setIsLoadingOffers(false);
      }
    };

    fetchOffers();
  }, [productId, country]);

  // Fetch eBay items
  useEffect(() => {
    if (!product?.title) return;

    const shouldFetchEbay =
      EU_COUNTRIES.includes(country) || country !== "RO" || retryToken > 0;

    if (!shouldFetchEbay) return;

    const fetchEbay = async () => {
      setIsLoadingEbay(true);
      setEbayError(null);

      try {
        const items = await fetchEbayItems(product.title, 10);
        setEbayItems(items);
      } catch (error) {
        console.error("Error fetching eBay items:", error);
        setEbayError("Failed to load eBay offers");
      } finally {
        setIsLoadingEbay(false);
      }
    };

    fetchEbay();
  }, [product?.title, country, retryToken]);

  const handleRetryEbay = () => {
    setRetryToken((prev) => prev + 1);
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoadingOffers) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (offersError || !product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {offersError || "Product Not Found"}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              We couldn't find the product you're looking for.
            </p>
            <button
              onClick={handleGoBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex gap-6">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-32 h-32 object-contain rounded-lg bg-slate-100 dark:bg-slate-700"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {product.title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Product ID: {product.id}
              </p>
              {product.minPrice && (
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  From {product.minPrice.toFixed(2)} {product.currency}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  {offers.length} store offers
                </span>
                {ebayItems.length > 0 && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                    {ebayItems.length} eBay offers
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Store Offers */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Store Offers
          </h2>
          
          {offers.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400 text-center py-8">
              No store offers available for this product yet.
            </p>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">
                          {offer.storeName}
                        </h3>
                        {offer.badge && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                            {offer.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {offer.price.toFixed(2)} {offer.currency}
                      </div>
                      {offer.shippingInfo && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {offer.shippingInfo}
                        </p>
                      )}
                    </div>
                    <a
                      href={offer.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Go to Store →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* eBay Offers */}
        {(EU_COUNTRIES.includes(country) || country !== "RO" || retryToken > 0) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Extra Offers from eBay
              </h2>
              {isLoadingEbay && (
                <span className="text-sm text-slate-500">Loading…</span>
              )}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              These links use affiliate marketing through Skimlinks to support our service.
            </p>

            {isLoadingEbay && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ebayError && (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 mb-4">{ebayError}</p>
                <button
                  onClick={handleRetryEbay}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoadingEbay && !ebayError && ebayItems.length === 0 && (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                No eBay offers found for this product.
              </p>
            )}

            {!isLoadingEbay && !ebayError && ebayItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ebayItems.map((item) => (
                  <div
                    key={item.id}
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
                          {item.price > 0 ? (
                            `${item.price.toFixed(2)} ${item.currency}`
                          ) : (
                            "See price on eBay"
                          )}
                        </div>
                        <a
                          href={item.url}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
