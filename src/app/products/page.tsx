// src/app/products/page.tsx

import React from "react";

// Fetch product data from your API route
async function getProducts() {
  const res = await fetch("/api/products", {
    cache: "no-store", // ensures fresh data is fetched
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  const data = await res.json();
  return data.products;
}

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

// This is your actual page component
export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
        All Products
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {products.map((product: any) => (
          <div
            key={product.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "1rem",
              background: "#fff",
              boxShadow: "0 0 5px rgba(0,0,0,0.05)",
            }}
          >
            <img
              src={
                product.thumbnailUrl ||
                product.imageUrl ||
                "https://via.placeholder.com/250"
              }
              alt={product.displayName || product.name}
              style={{ width: "100%", height: "180px", objectFit: "cover" }}
            />
            <h2 style={{ fontSize: "1.1rem", marginTop: "0.5rem" }}>
              {product.displayName || product.name}
            </h2>
            <p style={{ color: "#666" }}>
              {product.price ? `${product.price} ${product.currency || ""}` : ""}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
