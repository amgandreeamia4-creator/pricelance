// src/app/c/[slug]/CategoryProductGrid.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface CategoryProductGridProps {
  categoryKey: string;
}

interface Product {
  id: string;
  name: string;
  displayName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  listings: {
    id: string;
    storeId?: string | null;
    storeName?: string | null;
    price?: number | null;
    currency?: string | null;
    url?: string | null;
    fastDelivery?: boolean | null;
    deliveryTimeDays?: number | null;
    inStock?: boolean | null;
  }[];
}

export default function CategoryProductGrid({ categoryKey }: CategoryProductGridProps) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(
          `/api/products?category=${encodeURIComponent(categoryKey)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Eroare la încărcarea produselor: ${res.status}`);
        }

        const data = await res.json();
        
        // Support both array response and { products: [...] } shape
        const productsArray = Array.isArray(data) ? data : data.products || [];
        
        setProducts(productsArray);
      } catch (err) {
        console.error('Error fetching category products:', err);
        setError('Nu am putut încărca produsele. Te rugăm să încerci din nou mai târziu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryKey]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Încărcăm produsele...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // No products state
  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Nu avem produse în această categorie momentan.
          </p>
        </div>
      </div>
    );
  }

  // Helper function to get the lowest price from listings
  const getLowestPrice = (product: Product) => {
    if (!product.listings || product.listings.length === 0) return null;
    
    const prices = product.listings
      .filter(listing => listing.price != null && listing.price > 0)
      .map(listing => listing.price!);
    
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const getCurrency = (product: Product) => {
    if (!product.listings || product.listings.length === 0) return 'RON';
    
    const listingWithPrice = product.listings.find(
      listing => listing.price != null && listing.currency
    );
    
    return listingWithPrice?.currency || 'RON';
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => {
        const lowestPrice = getLowestPrice(product);
        const currency = getCurrency(product);
        const displayName = product.displayName || product.name;

        return (
          <div
            key={product.id}
            className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
          >
            {/* Product Image */}
            <div className="mb-3 aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={displayName}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-2 text-gray-400 dark:text-gray-500">
                      <svg
                        className="mx-auto h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fără imagine</p>
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-2">
              <h3 className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {displayName}
              </h3>
              
              {product.brand && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</p>
              )}

              {/* Price */}
              {lowestPrice ? (
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {lowestPrice.toFixed(2)} {currency}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {product.listings?.length} oferte
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Preț indisponibil
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
