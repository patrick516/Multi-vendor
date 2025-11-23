"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import LiveSnapshotStats from "./features/home/LiveSnapshotStats";
import ProductCard from "./features/products/ProductCard";
import type { Product } from "./features/products/types";
import { fetchJson } from "./utils/fetcher";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function HomePage() {
  const router = useRouter();

  const [districts, setDistricts] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [search, setSearch] = useState("");

  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [topError, setTopError] = useState<string | null>(null);

  // HERO slider index
  const [heroIndex, setHeroIndex] = useState(0);

  // Load districts + categories for filter bar
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

  // Load top picks – use /public/top-products
  useEffect(() => {
    async function loadTop() {
      try {
        setLoadingTop(true);
        setTopError(null);

        const products = await fetchJson<Product[]>(
          "/public/top-products?limit=10"
        );
        setTopProducts(products);
      } catch (err: any) {
        setTopError(err.message || "Failed to load top products");
      } finally {
        setLoadingTop(false);
      }
    }
    loadTop();
  }, []);

  // HERO products (just first 4)
  const heroProducts = useMemo(
    () => (topProducts.length > 0 ? topProducts.slice(0, 4) : []),
    [topProducts]
  );

  // Auto-advance hero slide
  useEffect(() => {
    if (heroProducts.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroProducts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroProducts.length]);

  const activeHeroProduct =
    heroProducts.length > 0 ? heroProducts[heroIndex] : null;

  function handleBrowseClick() {
    const params = new URLSearchParams();
    if (selectedDistrict) params.set("district", selectedDistrict);
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
    if (search.trim()) params.set("search", search.trim());

    const query = params.toString();
    const url = query ? `/products?${query}` : "/products";
    router.push(url);
  }

  return (
    <div className="pb-12 space-y-8">
      {/* HERO SECTION */}
      <section className="grid gap-8 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-slate-50 px-4 py-8 md:grid-cols-[minmax(0,2.1fr),minmax(0,1.5fr)] md:px-8 md:py-10">
        {/* Left side: text */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-800">
            <span className="rounded-full bg-emerald-600 px-2 py-[2px] text-[10px] text-white">
              NEW
            </span>
            <span>Gateway for Malawian trade</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
              Gateway to trade reliably in Malawi and beyond
            </h1>
            <p className="max-w-xl text-sm text-slate-600">
              Trade Point Malawi connects buyers and vendors across all
              districts. Verified vendors, location-based search, and
              transparent communication – all in one platform built for Malawi.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleBrowseClick}
              className="rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
            >
              Browse products
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("how-it-works");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              How it works
            </button>
          </div>
        </div>

        {/* Right side: hero product showcase */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-sm p-4 bg-white border shadow-sm rounded-2xl border-emerald-100">
            {activeHeroProduct ? (
              <>
                <div className="flex items-center justify-center h-40 gap-4 rounded-xl bg-gradient-to-br from-emerald-50 via-sky-50 to-slate-50">
                  {/* Image */}
                  <div className="w-24 overflow-hidden h-28 rounded-2xl bg-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        activeHeroProduct.mainImageUrl ||
                        activeHeroProduct.imageUrl ||
                        "/file.svg"
                      }
                      alt={activeHeroProduct.name}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  {/* Mini info stack */}
                  <div className="flex flex-col justify-between flex-1 h-28">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-700">
                        Featured
                      </p>
                      <p className="text-xs font-semibold line-clamp-2 text-slate-900">
                        {activeHeroProduct.name}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        MK{" "}
                        {(
                          activeHeroProduct.displayPrice ??
                          activeHeroProduct.price ??
                          activeHeroProduct.basePrice ??
                          0
                        ).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/products/${activeHeroProduct.id}`)
                      }
                      className="self-start rounded-md bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700"
                    >
                      View product
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                  >
                    Search
                  </button>
                  <div className="px-3 py-2 text-right rounded-lg bg-emerald-50">
                    <p className="text-xs font-semibold text-emerald-800">
                      {topProducts.length || 0}+
                    </p>
                    <p className="text-[10px] text-emerald-700">
                      Active listings
                    </p>
                  </div>
                </div>
              </>
            ) : (
              // Fallback skeleton if no hero product
              <>
                <div className="flex items-center justify-center h-40 gap-4 rounded-xl bg-gradient-to-br from-emerald-50 via-sky-50 to-slate-50">
                  <div className="w-16 h-28 rounded-2xl bg-slate-200" />
                  <div className="flex flex-col w-32 gap-2 h-28">
                    <div className="h-12 rounded-lg bg-slate-200" />
                    <div className="h-12 rounded-lg bg-slate-200" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                  >
                    Search
                  </button>
                  <div className="px-3 py-2 text-right rounded-lg bg-emerald-50">
                    <p className="text-xs font-semibold text-emerald-800">0</p>
                    <p className="text-[10px] text-emerald-700">
                      Active listings
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <section
        id="filter-bar"
        className="px-4 py-4 bg-white shadow-sm rounded-2xl ring-1 ring-slate-100"
      >
        <div className="grid gap-3 md:grid-cols-[1fr,1fr,2fr,auto] items-end">
          {/* District */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-700">
              District
            </label>
            <select
              className="w-full px-3 py-2 text-sm bg-white border rounded-md border-slate-200"
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
            <label className="text-[11px] font-medium text-slate-700">
              Category
            </label>
            <select
              className="w-full px-3 py-2 text-sm bg-white border rounded-md border-slate-200"
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
            <label className="text-[11px] font-medium text-slate-700">
              Search
            </label>
            <input
              className="w-full px-3 py-2 text-sm bg-white border rounded-md border-slate-200"
              placeholder='e.g. "maize", "tractor", "laptop"...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Button */}
          <div className="flex items-end">
            <button
              onClick={handleBrowseClick}
              className="w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
            >
              Search
            </button>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-slate-500">
          Showing popular products across Malawi. Use the filters above to
          narrow down by district and category.
        </p>
      </section>

      {/* LIVE SNAPSHOT */}
      <section>
        <LiveSnapshotStats />
      </section>

      {/* TOP PICKS SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Top picks this week
            </h2>
            <p className="text-[11px] text-slate-600">
              A snapshot of products from active vendors around Malawi.
            </p>
          </div>
          <button
            onClick={() => router.push("/products")}
            className="text-[11px] font-medium text-green-700 hover:text-green-800"
          >
            View all
          </button>
        </div>

        {loadingTop && (
          <p className="text-sm text-slate-500">Loading top products…</p>
        )}
        {topError && <p className="text-sm text-red-500">{topError}</p>}

        {!loadingTop && !topError && topProducts.length === 0 && (
          <p className="text-sm text-slate-600">
            No products found yet. Once vendors start listing, they will appear
            here.
          </p>
        )}

        {!loadingTop && !topError && topProducts.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* How it works placeholder */}
      <section id="how-it-works" className="mt-4 space-y-2">
        <h2 className="text-base font-semibold text-slate-900">
          How Trade Point Malawi works
        </h2>
        <p className="text-[11px] text-slate-600">
          Vendors manage their listings from a secure panel. Buyers browse by
          district and category, send requests, and vendors contact them to
          complete the trade.
        </p>
      </section>
    </div>
  );
}
