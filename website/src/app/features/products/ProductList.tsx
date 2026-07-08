"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // ⬅️ NEW
import type { Product } from "./types";
import { fetchJson } from "@/app/utils/fetcher";
import ProductCard from "./ProductCard";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface LatLng {
  lat: number;
  lng: number;
}

const NEARBY_RADIUS_KM = 10; // 10 km radius

export default function ProductList() {
  const searchParams = useSearchParams(); // ⬅️ NEW

  const [districts, setDistricts] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [search, setSearch] = useState("");

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [nearbyProducts, setNearbyProducts] = useState<Product[]>([]);
  const [otherProducts, setOtherProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // ⬅️ NEW: Load category from URL on page load
  useEffect(() => {
    const catFromUrl = searchParams.get("categoryId");
    if (catFromUrl) {
      setSelectedCategoryId(catFromUrl);
    }
  }, [searchParams]);

  // Load districts & categories on mount
  useEffect(() => {
    async function loadFilters() {
      try {
        const [d, c] = await Promise.all([
          fetchJson<string[]>("/meta/districts"),
          fetchJson<Category[]>("/categories"),
        ]);
        setDistricts(d);
        setCategories(c);
      } catch (err: any) {
        console.error("Failed to load filters", err);
      }
    }
    loadFilters();
  }, []);

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("Geolocation denied or failed:", err);
      },
    );
  }, []);

  // Load products whenever filters change
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (selectedDistrict) params.set("district", selectedDistrict);
        if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
        if (search.trim()) params.set("search", search.trim());

        let path = "/products";
        const query = params.toString();
        if (query) path += `?${query}`;

        const data = await fetchJson<Product[]>(path);
        setAllProducts(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [selectedDistrict, selectedCategoryId, search]);

  // Compute nearby vs other products when allProducts or userLocation changes
  useEffect(() => {
    if (!userLocation) {
      setNearbyProducts([]);
      setOtherProducts(allProducts);
      return;
    }

    const withCoords = allProducts.filter(
      (p) => typeof p.latitude === "number" && typeof p.longitude === "number",
    );

    const productsWithDistance = withCoords.map((p) => {
      const dist = haversineDistance(userLocation, {
        lat: p.latitude as number,
        lng: p.longitude as number,
      });
      return { ...p, _distanceKm: dist };
    });

    const near = productsWithDistance
      .filter((p) => p._distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a._distanceKm - b._distanceKm);

    const nearIds = new Set(near.map((p) => p.id));
    const others = allProducts.filter((p) => !nearIds.has(p.id));

    setNearbyProducts(near);
    setOtherProducts(others);
  }, [allProducts, userLocation]);

  return (
    <section className="pb-10 space-y-6">
      {/* Filter bar */}
      <section
        id="product-filters"
        className="px-4 py-4 space-y-3 bg-white shadow-sm rounded-2xl ring-1 ring-slate-100"
      >
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
          Filter products
        </h2>

        <div className="grid items-end gap-3 md:grid-cols-3">
          {/* District */}
          <div className="space-y-1">
            <label className="text-lg font-medium text-slate-700">
              District
            </label>
            <select
              className="w-full px-3 py-2 bg-white border rounded-md text-md border-slate-300"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-lg font-medium text-slate-700">
              Category
            </label>
            <select
              className="w-full px-3 py-2 bg-white border rounded-md text-md border-slate-300"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="space-y-1">
            <label className="text-lg font-medium text-slate-700">Search</label>
            <input
              className="w-full px-3 py-2 bg-white border rounded-md text-md border-slate-300"
              placeholder='e.g. "maize", "tractor", "laptop"...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Nearby products section */}
      {userLocation && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Products near you (within {NEARBY_RADIUS_KM} km)
          </h2>
          {nearbyProducts.length === 0 && (
            <p className="text-sm text-slate-600">
              No products found within {NEARBY_RADIUS_KM} km of your location.
            </p>
          )}
          {nearbyProducts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* All/other products */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          {userLocation ? "More products" : "All products"}
        </h2>
        {loading && <p className="text-sm text-slate-500">Loading products…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && allProducts.length === 0 && (
          <p className="text-sm text-slate-600">
            No products found. Try changing your filters.
          </p>
        )}
        {!loading &&
          !error &&
          (userLocation ? otherProducts : allProducts).length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(userLocation ? otherProducts : allProducts).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
      </section>
    </section>
  );
}

// Haversine distance between two points (km)
function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const c =
    sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
  const d = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));

  return R * d;
}
