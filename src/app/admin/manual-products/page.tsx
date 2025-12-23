// src/app/admin/manual-products/page.tsx
"use client";

import React, { useState, useEffect } from "react";

const STORE_OPTIONS = ["emag", "altex", "pcgarage", "flanco", "amazon_de", "other_eu"];

type AdminProduct = {
  id: string;
  name: string;
  displayName: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  listingsCount: number;
};

export default function ManualProductsPage() {
  // Product list state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Product form state
  const [productName, setProductName] = useState("");
  const [productDisplayName, setProductDisplayName] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productMsg, setProductMsg] = useState<string | null>(null);

  // Track which product has its listing form expanded
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Listing form state (per expanded product)
  const [listingStoreId, setListingStoreId] = useState("emag");
  const [listingStoreName, setListingStoreName] = useState("eMAG");
  const [listingUrl, setListingUrl] = useState("");
  const [listingPrice, setListingPrice] = useState<number>(0);
  const [listingCurrency, setListingCurrency] = useState("RON");
  const [listingFastDelivery, setListingFastDelivery] = useState(false);
  const [listingDeliveryDays, setListingDeliveryDays] = useState<number | "">("");
  const [listingMsg, setListingMsg] = useState<string | null>(null);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/products?page=1&pageSize=20");
      if (!res.ok) {
        setLoadError("Failed to load products");
        setProducts([]);
        return;
      }
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setLoadError("Failed to load products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductMsg(null);

    if (!productName.trim()) {
      setProductMsg("Error: name is required");
      return;
    }

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName.trim(),
          displayName: productDisplayName.trim() || undefined,
          brand: productBrand.trim() || undefined,
          category: productCategory.trim() || undefined,
          imageUrl: productImageUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setProductMsg(`Error: ${data.error || "Failed to create product"}`);
        return;
      }

      // Success - clear form and refresh
      setProductName("");
      setProductDisplayName("");
      setProductBrand("");
      setProductCategory("");
      setProductImageUrl("");
      setProductMsg("Product created successfully!");
      fetchProducts();
    } catch (err) {
      console.error("Error creating product:", err);
      setProductMsg("Error: Network error");
    }
  }

  function handleToggleListingForm(productId: string) {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(productId);
      // Reset listing form
      setListingStoreId("emag");
      setListingStoreName("eMAG");
      setListingUrl("");
      setListingPrice(0);
      setListingCurrency("RON");
      setListingFastDelivery(false);
      setListingDeliveryDays("");
      setListingMsg(null);
    }
  }

  async function handleSaveListing(e: React.FormEvent) {
    e.preventDefault();
    setListingMsg(null);

    if (!expandedProductId) return;

    try {
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: expandedProductId,
          storeId: listingStoreId,
          storeName: listingStoreName.trim(),
          url: listingUrl.trim() || undefined,
          price: listingPrice,
          currency: listingCurrency.trim(),
          fastDelivery: listingFastDelivery,
          deliveryTimeDays: listingDeliveryDays === "" ? undefined : listingDeliveryDays,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setListingMsg(`Error: ${data.error || "Failed to create listing"}`);
        return;
      }

      // Success - clear form
      setListingUrl("");
      setListingPrice(0);
      setListingDeliveryDays("");
      setListingMsg("Saved!");
    } catch (err) {
      console.error("Error creating listing:", err);
      setListingMsg("Error: Network error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Manual Products Admin</h1>
          <a
            href="/admin/import-csv"
            className="text-sm px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            CSV Import →
          </a>
        </div>

        {/* CREATE PRODUCT FORM */}
        <div className="mb-8 p-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-4">Create Product</h2>
          <form onSubmit={handleCreateProduct} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm"
                placeholder="e.g., Apple iPhone 15 Pro"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">displayName</label>
              <input
                type="text"
                value={productDisplayName}
                onChange={(e) => setProductDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">brand</label>
                <input
                  type="text"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">category</label>
                <input
                  type="text"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">imageUrl</label>
              <input
                type="text"
                value={productImageUrl}
                onChange={(e) => setProductImageUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Create product
            </button>
            {productMsg && (
              <p className={`text-sm ${productMsg.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
                {productMsg}
              </p>
            )}
          </form>
        </div>

        {/* PRODUCTS & LISTINGS LIST */}
        <div className="p-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-4">Products &amp; Listings</h2>

          {isLoading && <p className="text-sm text-slate-500">Loading products...</p>}
          {loadError && <p className="text-sm text-red-500">{loadError}</p>}

          {!isLoading && !loadError && products.length === 0 && (
            <p className="text-sm text-slate-500">No products found.</p>
          )}

          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      {product.displayName || product.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {product.brand && <span className="mr-2">Brand: {product.brand}</span>}
                      {product.category && <span className="mr-2">Category: {product.category}</span>}
                      <span>Listings: {product.listingsCount}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleListingForm(product.id)}
                    className="text-xs px-3 py-1 bg-slate-200 dark:bg-slate-600 rounded hover:bg-slate-300 dark:hover:bg-slate-500"
                  >
                    {expandedProductId === product.id ? "Cancel" : "Add listing"}
                  </button>
                </div>

                {/* Inline listing form */}
                {expandedProductId === product.id && (
                  <form onSubmit={handleSaveListing} className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs mb-1">storeId</label>
                        <select
                          value={listingStoreId}
                          onChange={(e) => setListingStoreId(e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs"
                        >
                          {STORE_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">storeName</label>
                        <input
                          type="text"
                          value={listingStoreName}
                          onChange={(e) => setListingStoreName(e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">url</label>
                      <input
                        type="text"
                        value={listingUrl}
                        onChange={(e) => setListingUrl(e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs mb-1">price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={listingPrice}
                          onChange={(e) => setListingPrice(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">currency</label>
                        <input
                          type="text"
                          value={listingCurrency}
                          onChange={(e) => setListingCurrency(e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs mb-1">deliveryTimeDays</label>
                        <input
                          type="number"
                          value={listingDeliveryDays}
                          onChange={(e) => setListingDeliveryDays(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs"
                        />
                      </div>
                      <div className="flex items-center pt-4">
                        <label className="flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={listingFastDelivery}
                            onChange={(e) => setListingFastDelivery(e.target.checked)}
                          />
                          fastDelivery
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        Save listing
                      </button>
                      {listingMsg && (
                        <span className={`text-xs ${listingMsg.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
                          {listingMsg}
                        </span>
                      )}
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
