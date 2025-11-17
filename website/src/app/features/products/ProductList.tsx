// website/src/app/features/products/ProductList.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchJson } from "@/app/utils/fetcher";
import type { Product } from "./types";
import ProductCard from "./ProductCard";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const path = q
          ? `/products?search=${encodeURIComponent(q)}`
          : "/products";

        const data = await fetchJson<Product[]>(path);
        setProducts(data);
      } catch (err: any) {
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [q]);

  return (
    <section className="space-y-3">
      {q && (
        <p className="text-[11px] text-text-muted">
          Showing results for <span className="font-semibold">"{q}"</span>
        </p>
      )}

      {loading && (
        <p className="text-sm text-text-muted">Loading products...</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <p className="text-sm text-text-muted">
              No products found{q ? ` for "${q}"` : ""}. Please try a different
              search.
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
