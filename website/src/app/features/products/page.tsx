// website/src/features/app/products/page.tsx
"use client"; // REQUIRED because ProductList uses useSearchParams

import { Suspense } from "react";
import ProductList from "@/app/features/products/ProductList";

export default function ProductsPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-text-main">Browse products</h1>
        <p className="text-sm text-text-muted">
          Explore all active products listed by our vendors. Stock updates when
          vendors mark items as sold in the admin panel.
        </p>
      </header>

      <Suspense fallback={<div>Loading products…</div>}>
        <ProductList />
      </Suspense>
    </div>
  );
}
