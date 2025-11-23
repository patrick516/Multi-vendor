"use client";

import ProductList from "@/app/features/products/ProductList";
import dynamic from "next/dynamic";

// MapView uses Leaflet, so it must be rendered client-side only
const MapView = dynamic(() => import("@/app/features/products/MapView"), {
  ssr: false,
});

export default function ProductsPage() {
  return (
    <div className="pb-10 space-y-4">
      {/* <header className="space-y-1">
        <h1 className="text-2xl font-bold text-text-main">Browse products</h1>
        <p className="text-sm text-text-muted">
          Explore all active products listed by our vendors. Stock and location
          update when vendors add items or mark them as sold.
        </p>
      </header> */}

      {/* Map showing products with coordinates (optional) */}
      {/* <MapView /> */}

      {/* Product grid */}
      <ProductList />
    </div>
  );
}
