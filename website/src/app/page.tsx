"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import LiveSnapshotStats from "./features/home/LiveSnapshotStats";
import ProductCard from "./features/products/ProductCard";
import type { Product } from "./features/products/types";
import { fetchJson } from "./utils/fetcher";
import ScrollTopButton from "./components/ScrollTopButton";

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
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      ),
    [categories, categorySearch]
  );

  // Small loading spinner
  function Spinner() {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-slate-500">
        <span className="w-4 h-4 border-2 rounded-full border-t-transparent animate-spin" />
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
            className="flex flex-col p-3 bg-white border shadow-sm rounded-2xl border-slate-100 animate-pulse"
          >
            <div className="w-full h-36 rounded-xl bg-slate-200" />
            <div className="w-3/4 h-4 mt-2 rounded bg-slate-200" />
            <div className="w-1/2 h-6 mt-2 rounded bg-slate-200" />
            <div className="flex gap-2 mt-3">
              <span className="w-16 h-5 rounded-full bg-slate-200" />
              <span className="w-20 h-5 rounded-full bg-slate-200" />
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
        <div className="flex items-center justify-center h-40 gap-4 rounded-xl bg-gradient-to-br from-emerald-50 via-sky-50 to-slate-50">
          <div className="w-24 h-28 rounded-2xl bg-slate-200" />
          <div className="flex flex-col justify-between flex-1 gap-2 h-28">
            <div className="w-2/3 h-3 rounded bg-slate-200" />
            <div className="w-3/4 h-4 rounded bg-slate-200" />
            <div className="w-1/2 h-6 rounded bg-slate-200" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="w-20 h-8 rounded-md bg-slate-200" />
          <div className="w-24 h-10 rounded-lg bg-slate-200" />
        </div>

        <div className="flex justify-center gap-2 mt-3">
          <span className="w-5 h-2 rounded-full bg-slate-200" />
          <span className="w-2 h-2 rounded-full bg-slate-200" />
          <span className="w-2 h-2 rounded-full bg-slate-200" />
        </div>
      </div>
    );
  }

  // HERO products (just first 4)
  const heroProducts = useMemo(
    () => (topProducts.length > 0 ? topProducts.slice(0, 4) : []),
    [topProducts]
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
          "/public/top-products?limit=10"
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
    <div className="min-h-screen px-4 py-6 bg-gradient-to-b from-emerald-50 via-white to-slate-50 md:px-8 md:py-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* TOP STRIP */}
        <header className="flex flex-col justify-between gap-4 pb-4 border-b border-emerald-100 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Trade Point Malawi
            </p>
            <p className="text-sm text-slate-600">
              A trusted marketplace connecting districts, vendors and buyers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="px-3 py-1 font-medium rounded-full bg-emerald-100 text-emerald-800">
              Verified vendors
            </span>
            <span className="px-3 py-1 font-medium rounded-full bg-sky-100 text-sky-800">
              Location-based search
            </span>
            <span className="px-3 py-1 font-medium rounded-full bg-amber-50 text-amber-800">
              Made for Malawi
            </span>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="grid gap-8 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-slate-50 px-4 py-8 shadow-[0_20px_60px_rgba(15,118,110,0.10)] ring-1 ring-emerald-100 md:grid-cols-[minmax(0,2.1fr),minmax(0,1.5fr)] md:px-8 md:py-10">
          {/* Left side: text */}
          <div className="flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl slide-stop-center">
                Gateway to trade reliably in{" "}
                <span className="text-transparent bg-gradient-to-r from-emerald-600 to-sky-500 bg-clip-text">
                  Malawi and beyond
                </span>
              </h1>

              <p className="max-w-xl text-lg font-montserrat text-slate-600">
                Trade Point Malawi connects buyers and vendors across all
                districts. Verified vendors, location-based search, and
                transparent communication – all in one platform built for
                Malawi.
              </p>

              <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <div className="p-3 shadow-sm rounded-2xl bg-white/80 ring-1 ring-emerald-50">
                  <p className="text-sm font-semibold tracking-wide uppercase text-emerald-700">
                    Vendors
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Grow your customer reach
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage products, enquiries and districts from one dashboard.
                  </p>
                </div>
                <div className="p-3 shadow-sm rounded-2xl bg-white/80 ring-1 ring-sky-50">
                  <p className="text-sm font-semibold tracking-wide uppercase text-sky-700">
                    Buyers
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Search by district & category
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Find trusted vendors close to you then reach out directly.
                  </p>
                </div>
                <div className="p-3 shadow-sm rounded-2xl bg-white/80 ring-1 ring-amber-50">
                  <p className="text-sm font-semibold tracking-wide uppercase text-amber-700">
                    Safe trading
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Clear communication
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Every request is tracked so vendors and buyers stay aligned.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleBrowseClick}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(22,163,74,0.45)] transition hover:bg-green-700"
              >
                Browse products
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("how-it-works");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                How it works
              </button>
            </div>
          </div>

          {/* Right side: hero product showcase */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-[0_18px_40px_rgba(15,118,110,0.18)] backdrop-blur">
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
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          Featured this week
                        </p>
                        <p className="text-xl font-semibold line-clamp-2 text-slate-900">
                          {activeHeroProduct.name}
                        </p>
                        <p className="text-2xl font-semibold text-emerald-700">
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
                        className="mt-2 self-start rounded-md bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700"
                      >
                        View product
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <button
                      type="button"
                      onClick={handleBrowseClick}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Search
                    </button>
                    <div className="px-3 py-2 text-right rounded-lg bg-emerald-50">
                      <p className="text-sm font-semibold text-emerald-800">
                        {topProducts.length || 0}+
                      </p>
                      <p className="text-sm text-emerald-700">
                        Active listings
                      </p>
                    </div>
                  </div>

                  {/* Slider dots */}
                  {heroProducts.length > 1 && (
                    <div className="flex justify-center gap-2 mt-3">
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

        {/* FILTER BAR */}
        <section
          id="filter-bar"
          className="px-4 py-4 bg-white shadow-sm rounded-2xl ring-1 ring-slate-100"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Fine-tune your search
              </h2>
              <p className="text-sm text-slate-500">
                Filter by district, category or keyword – then browse detailed
                vendor listings.
              </p>
            </div>
          </div>

          <div className="grid items-end gap-3 md:grid-cols-[1fr,1fr,2fr,auto]">
            {/* District */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
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

            {/* Category - searchable dropdown */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Category
              </label>
              <div className="relative">
                <input
                  className="w-full px-3 py-2 pr-8 text-sm bg-white border rounded-md border-slate-200"
                  type="text"
                  placeholder="All categories"
                  value={categorySearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCategorySearch(value);
                    setCategoryOpen(true);

                    // If user clears input, reset filter
                    if (!value.trim()) {
                      setSelectedCategoryId("");
                    }
                  }}
                  onFocus={() => setCategoryOpen(true)}
                  onBlur={() => {
                    // small delay so click can register before closing
                    setTimeout(() => setCategoryOpen(false), 150);
                  }}
                />

                {/* Small ▼ icon */}
                <span className="absolute inset-y-0 flex items-center text-sm pointer-events-none right-2 text-slate-400">
                  ▼
                </span>

                {/* Dropdown list */}
                {categoryOpen && (
                  <div className="absolute z-30 w-full mt-1 overflow-auto bg-white border rounded-md shadow-md max-h-56 border-slate-200">
                    {/* "All categories" option */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedCategoryId("");
                        setCategorySearch("");
                        setCategoryOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
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
                          className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                            String(cat.id) === selectedCategoryId
                              ? "bg-slate-100 font-semibold"
                              : ""
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        No category matches “{categorySearch}”
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
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

          <p className="mt-2 text-sm font-montserrat text-slate-500">
            Showing popular products across Malawi. Use the filters above to
            narrow down by district and category.
          </p>
        </section>

        {/* LIVE SNAPSHOT */}
        <section className="px-4 py-4 shadow-sm rounded-2xl bg-white/80 ring-1 ring-slate-100">
          <LiveSnapshotStats />
        </section>

        {/* TOP PICKS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Top picks this week
              </h2>
              <p className="text-sm text-slate-600">
                A snapshot of products from active vendors around Malawi.
              </p>
            </div>
            <button
              onClick={() => router.push("/products")}
              className="text-sm font-medium text-green-700 hover:text-green-800"
            >
              View all products
            </button>
          </div>

          {loadingTop && (
            <div className="space-y-2">
              <Spinner />
              <TopProductsSkeleton />
            </div>
          )}

          {topError && <p className="text-sm text-red-500">{topError}</p>}

          {!loadingTop && !topError && topProducts.length === 0 && (
            <p className="text-sm text-slate-600">
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

        {/* How it works */}
        <section
          id="how-it-works"
          className="px-4 py-5 mt-2 space-y-4 bg-white shadow-sm rounded-2xl ring-1 ring-slate-100"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              How Trade Point Malawi works
            </h2>
            <p className="text-sm text-slate-600">
              Vendors manage their listings from a secure panel. Buyers browse
              by district and category, send requests, and vendors contact them
              to complete the trade.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-sm font-semibold tracking-wide uppercase text-slate-500">
                1. Vendors list products
              </p>
              <p className="mt-1">
                Vendors upload product details, prices and districts from their
                dashboard.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-sm font-semibold tracking-wide uppercase text-slate-500">
                2. Buyers search & request
              </p>
              <p className="mt-1">
                Buyers filter by district and category, then send enquiries to
                the vendors they choose.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-sm font-semibold tracking-wide uppercase text-slate-500">
                3. Trade directly
              </p>
              <p className="mt-1">
                Vendors follow up with buyers to agree on payment and delivery
                details offline or via their preferred channels.
              </p>
            </div>
          </div>
        </section>
      </div>
      <ScrollTopButton />
    </div>
  );
}
