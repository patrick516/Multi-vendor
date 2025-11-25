// src/app/products/page.tsx
"use client";

import { Suspense } from "react";
import ProductList from "@/app/features/products/ProductList";
import dynamic from "next/dynamic";

// MapView uses Leaflet, so it must be rendered client-side only
const MapView = dynamic(() => import("@/app/features/products/MapView"), {
  ssr: false,
  loading: () => <div>Loading map…</div>,
});

export default function ProductsPage() {
  return (
    <div className="pb-10 space-y-4">
      {/* Optional map */}
      {/* 
      <Suspense fallback={<div>Loading map…</div>}>
        <MapView />
      </Suspense>
      */}

      <Suspense fallback={<div>Loading products…</div>}>
        <ProductList />
      </Suspense>
    </div>
  );
}
