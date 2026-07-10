"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import LiveSnapshotStats from "./features/home/LiveSnapshotStats";
import ProductCard from "./features/products/ProductCard";
import type { Product } from "./features/products/types";
import { fetchJson } from "./utils/fetcher";
import ScrollTopButton from "./components/ScrollTopButton";
import Link from "next/link";

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

  // Category search for filter bar
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);

  // HERO slider index
  const [heroIndex, setHeroIndex] = useState(0);

  const filteredCategories = useMemo(
    () =>
      categories.filter((cat) =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
      ),
    [categories, categorySearch],
  );

  // Small loading spinner
  function Spinner() {
    return (
      <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-500">
        <span className="w-4 h-4 border-2 rounded-full border-emerald-500/40 border-t-transparent animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  // Skeleton cards for Top Products grid
  function TopProductsSkeleton() {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col p-3 border shadow-sm bg-white/90 border-slate-100 rounded-2xl animate-pulse"
          >
            <div className="w-full h-40 rounded-xl bg-slate-100" />
            <div className="w-3/4 h-4 mt-3 rounded bg-slate-100" />
            <div className="w-1/2 h-4 mt-2 rounded bg-slate-100" />
            <div className="flex gap-2 mt-4">
              <span className="w-16 h-5 rounded-full bg-slate-100" />
              <span className="w-20 h-5 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Shimmer skeleton for the hero product card (right side)
  function HeroSkeleton() {
    return (
      <div className="animate-pulse">
        <div className="flex items-center justify-center gap-4 h-44 rounded-2xl bg-gradient-to-br from-emerald-50 via-sky-50 to-slate-50">
          <div className="w-24 h-28 rounded-2xl bg-slate-100" />
          <div className="flex flex-col justify-between flex-1 gap-2 h-28">
            <div className="w-2/3 h-3 rounded bg-slate-100" />
            <div className="w-3/4 h-4 rounded bg-slate-100" />
            <div className="w-1/2 h-6 rounded bg-slate-100" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="w-24 rounded-md h-9 bg-slate-100" />
          <div className="h-10 rounded-lg w-28 bg-slate-100" />
        </div>

        <div className="flex justify-center gap-2 mt-3">
          <span className="w-5 h-2 rounded-full bg-slate-100" />
          <span className="w-2 h-2 rounded-full bg-slate-100" />
          <span className="w-2 h-2 rounded-full bg-slate-100" />
        </div>
      </div>
    );
  }

  // HERO products (just first 4)
  const heroProducts = useMemo(
    () => (topProducts.length > 0 ? topProducts.slice(0, 4) : []),
    [topProducts],
  );

  const activeHeroProduct =
    heroProducts.length > 0 ? heroProducts[heroIndex] : null;

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
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err.message);
        } else {
          console.error("Failed to load Filters", err);
        }
      }
    }
    loadFilters();
  }, []);

  // Load top picks – use /public/top-products
  useEffect(() => {
    async function loadTop() {
      setLoadingTop(true);
      setTopError(null);

      try {
        const products = await fetchJson<Product[]>(
          "/public/top-products?limit=10",
        );
        setTopProducts(products);
      } catch (err: unknown) {
        console.error(err);

        let message = "Failed to load top products. Please try again.";

        if (err instanceof Error && err.message.includes("NetworkError")) {
          message = "Unable to reach the server. Please check your connection.";
        }

        setTopError(message);
      } finally {
        setLoadingTop(false);
      }
    }

    loadTop();
  }, []);

  // Auto-advance hero slide
  useEffect(() => {
    if (heroProducts.length === 0) return;

    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroProducts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroProducts.length]);

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
    <div className="min-h-screen bg-slate-50/80">
      {/* subtle top gradient / glow */}
      <div className="fixed inset-x-0 top-0 z-0 h-64 pointer-events-none bg-gradient-to-b from-emerald-100/60 via-slate-50 to-transparent" />

      <div className="relative z-10 max-w-6xl px-4 py-8 mx-auto space-y-10 md:px-6 lg:px-0 md:py-12">
        {/* TOP STRIP */}
        <header className="flex flex-col justify-between gap-4 pb-4 border-b border-slate-200/70 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-semibold tracking-[0.22em] uppercase rounded-full bg-emerald-50 text-emerald-700">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Trade Point Malawi
            </div>
            <h2 className="text-sm font-medium text-slate-700 sm:text-base">
              Gateway to trade remotely and reliably across all districts.
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Verified vendors
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-100 text-sky-800">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Location-based search
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Built for Malawi
            </span>
            <div className="md:hidden">
              <Link
                href="/sell"
                className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-full shadow-sm hover:text-white"
              >
                Sell on Trade Point
              </Link>
            </div>
          </div>
        </header>
        {/* HERO SECTION */}
        <section className="grid gap-6 rounded-3xl bg-white/90 px-4 py-5 shadow-[0_24px_70px_rgba(15,23,42,0.14)] ring-1 ring-slate-100 md:grid-cols-[minmax(0,2.1fr),minmax(0,1.5fr)] md:px-8 md:py-7">
          {/* Left side: text */}
          <div className="flex flex-col justify-center gap-5">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                Trade{" "}
                <span className="text-transparent bg-gradient-to-r from-emerald-600 to-sky-500 bg-clip-text">
                  reliably in Malawi
                </span>
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-slate-600">
                Buy and sell with verified vendors across all districts.
              </p>
            </div>

            {/* Primary actions */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={handleBrowseClick}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(22,163,74,0.45)] transition hover:bg-emerald-700"
              >
                Browse marketplace
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("how-it-works");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Learn how it works
              </button>
            </div>
          </div>

          {/* Right side: hero product showcase */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50/90 p-4 shadow-[0_22px_50px_rgba(16,185,129,0.25)] backdrop-blur">
              {activeHeroProduct ? (
                <>
                  <div className="flex items-center justify-center gap-4 py-3 rounded-2xl bg-white/80 ring-1 ring-emerald-50">
                    {/* Image */}
                    <div className="w-24 overflow-hidden h-28 rounded-2xl bg-slate-100">
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
                    <div className="flex flex-col justify-between flex-1 gap-2">
                      <div className="space-y-1">
                        <p className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Featured this week
                        </p>
                        <p className="text-sm font-semibold line-clamp-2 text-slate-900">
                          {activeHeroProduct.name}
                        </p>
                        <p className="text-xl font-semibold text-emerald-700">
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
                        className="mt-2 self-start rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        View product
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <button
                      type="button"
                      onClick={handleBrowseClick}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
                    >
                      <span>Search marketplace</span>
                    </button>
                    <div className="px-3 py-2 text-right rounded-lg bg-emerald-50/80 ring-1 ring-emerald-100">
                      <p className="text-sm font-semibold text-emerald-800">
                        {topProducts.length || 0}+
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Active listings
                      </p>
                    </div>
                  </div>

                  {heroProducts.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {heroProducts.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setHeroIndex(idx)}
                          className={`h-2.5 rounded-full transition ${
                            idx === heroIndex
                              ? "w-5 bg-emerald-600"
                              : "w-2 bg-emerald-200 hover:bg-emerald-300"
                          }`}
                          aria-label={`Show featured product ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <HeroSkeleton />
              )}
            </div>
          </div>
        </section>

        {/* TOP PICKS SECTION */}
        <section className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                Top picks this week
              </h2>
              <p className="text-xs text-slate-600 sm:text-sm">
                A snapshot of products from active vendors around Malawi.
              </p>
            </div>
            <button
              onClick={() => router.push("/products")}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 sm:text-sm"
            >
              View all products →
            </button>
          </div>

          {loadingTop && (
            <div className="space-y-4">
              <Spinner />
              <TopProductsSkeleton />
            </div>
          )}

          {topError && (
            <p className="text-xs text-red-500 sm:text-sm">{topError}</p>
          )}

          {!loadingTop && !topError && topProducts.length === 0 && (
            <p className="text-xs text-slate-600 sm:text-sm">
              No products found yet. Once vendors start listing, they will
              appear here.
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

        {/* FILTER BAR */}
        <section
          id="filter-bar"
          className="px-4 py-5 shadow-sm bg-white/95 rounded-2xl ring-1 ring-slate-100"
        >
          <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
            Filter products
          </h2>

          <div className="grid items-end gap-3 md:grid-cols-[1.1fr,1.3fr,2.1fr,auto]">
            {/* District */}
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-700 sm:text-sm">
                <span>District</span>
              </label>
              <select
                className="w-full px-3 py-2 text-xs bg-white border shadow-sm rounded-xl border-slate-200 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 sm:text-sm"
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

            {/* Category - searchable dropdown */}
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-700 sm:text-sm">
                <span>Category</span>
              </label>
              <div className="relative">
                <input
                  className="w-full px-3 py-2 text-xs bg-white border shadow-sm pr-9 rounded-xl border-slate-200 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 sm:text-sm"
                  type="text"
                  placeholder="All categories"
                  value={categorySearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCategorySearch(value);
                    setCategoryOpen(true);

                    if (!value.trim()) {
                      setSelectedCategoryId("");
                    }
                  }}
                  onFocus={() => setCategoryOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setCategoryOpen(false), 150);
                  }}
                />

                {/* Small ▼ icon */}
                <span className="absolute inset-y-0 flex items-center text-xs pointer-events-none right-2 text-slate-400">
                  ▼
                </span>

                {/* Dropdown list */}
                {categoryOpen && (
                  <div className="absolute z-30 w-full mt-1 overflow-auto bg-white border shadow-lg rounded-xl max-h-56 border-slate-200">
                    {/* "All categories" option */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedCategoryId("");
                        setCategorySearch("");
                        setCategoryOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-xs sm:text-sm hover:bg-slate-50 ${
                        !selectedCategoryId ? "bg-slate-50 font-semibold" : ""
                      }`}
                    >
                      All categories
                    </button>

                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedCategoryId(String(cat.id));
                            setCategorySearch(cat.name);
                            setCategoryOpen(false);
                          }}
                          className={`block w-full px-3 py-2 text-left text-xs sm:text-sm hover:bg-slate-50 ${
                            String(cat.id) === selectedCategoryId
                              ? "bg-slate-100 font-semibold"
                              : ""
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-slate-500 sm:text-sm">
                        No category matches “{categorySearch}”
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-700 sm:text-sm">
                <span>Search</span>
              </label>
              <div className="relative">
                <input
                  className="w-full px-3 py-2 text-xs bg-white border shadow-sm pl-9 rounded-xl border-slate-200 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 sm:text-sm"
                  placeholder='e.g. "maize", "tractor", "laptop"...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="absolute inset-y-0 flex items-center left-3 text-slate-400"></span>
              </div>
            </div>

            {/* Button */}
            <div className="flex items-end">
              <button
                onClick={handleBrowseClick}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 sm:text-sm"
              >
                Search
              </button>
            </div>
          </div>

          {/* <p className="mt-3 text-xs text-slate-500 sm:text-sm">
            Showing popular products across Malawi. Use the filters above to
            narrow down by district and category.
          </p> */}
        </section>

        {/* LIVE SNAPSHOT */}
        <section className="px-4 py-5 shadow-sm bg-white/95 rounded-2xl ring-1 ring-slate-100">
          <LiveSnapshotStats />
        </section>

        {/* TOP PICKS SECTION
        <section className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                Top picks this week
              </h2>
              <p className="text-xs text-slate-600 sm:text-sm">
                A snapshot of products from active vendors around Malawi.
              </p>
            </div>
            <button
              onClick={() => router.push("/products")}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 sm:text-sm"
            >
              View all products →
            </button>
          </div>

          {loadingTop && (
            <div className="space-y-4">
              <Spinner />
              <TopProductsSkeleton />
            </div>
          )}

          {topError && (
            <p className="text-xs text-red-500 sm:text-sm">{topError}</p>
          )}

          {!loadingTop && !topError && topProducts.length === 0 && (
            <p className="text-xs text-slate-600 sm:text-sm">
              No products found yet. Once vendors start listing, they will
              appear here.
            </p>
          )}

          {!loadingTop && !topError && topProducts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section> */}

        {/* How it works */}
        {/* <section
          id="how-it-works"
          className="px-4 py-4 mt-2 space-y-3 shadow-sm bg-white/95 rounded-2xl ring-1 ring-slate-100"
        >
          <h2 className="text-sm font-semibold text-slate-900">How it works</h2>

          <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/90">
              <span className="flex items-center justify-center w-5 h-5 text-[11px] font-semibold text-white rounded-full shrink-0 bg-emerald-600">
                1
              </span>
              <p>Vendors list products</p>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/90">
              <span className="flex items-center justify-center w-5 h-5 text-[11px] font-semibold text-white rounded-full shrink-0 bg-sky-600">
                2
              </span>
              <p>Buyers search & request</p>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/90">
              <span className="flex items-center justify-center w-5 h-5 text-[11px] font-semibold text-white rounded-full shrink-0 bg-amber-500">
                3
              </span>
              <p>Vendors follow up to complete the trade</p>
            </div>
          </div>
        </section> */}
      </div>

      <ScrollTopButton />
    </div>
  );
}
