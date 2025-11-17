// src/app/features/products/ProductList.tsx
"use client";

import { useEffect, useState } from "react";
// import { fetchJson } from "@/app/utils/fetcher";

import { fetchJson } from "@/app/utils/fetcher";
import type { Product } from "./types";
import ProductCard from "./ProductCard";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchJson<Product[]>("/products");
        setProducts(data);
      } catch (err: any) {
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="space-y-3">
      {loading && (
        <p className="text-sm text-text-muted">Loading products...</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <p className="text-sm text-text-muted">
              No products available yet. Please check back later.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
