// website/src/app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { API_BASE_URL } from "@/app/utils/fetcher";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Browse Products" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help / FAQ" },
];

interface SearchProduct {
  id: number;
  name: string;
  basePrice?: number;
  displayPrice?: number;
  district?: string | null;
  area?: string | null;
  category?: { id: number; name: string } | null;
}

interface SearchCategory {
  id: number;
  name: string;
  slug: string;
}

interface SearchVendor {
  id: number;
  name: string | null;
  email: string;
  subscriptionActive: boolean;
}

interface SearchResult {
  products: SearchProduct[];
  categories: SearchCategory[];
  vendors: SearchVendor[];
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mobileOpen, setMobileOpen] = useState(false);

  // 🔍 universal search state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // suggestions
  const [suggestions, setSuggestions] = useState<SearchResult | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // If URL has ?search=... and we are on /products, reflect that in the input
  useEffect(() => {
    const fromUrl = searchParams.get("search") || "";
    if (pathname.startsWith("/products")) {
      setSearchTerm(fromUrl);
      setDebouncedTerm(fromUrl);
    }
  }, [pathname, searchParams]);

  // Debounce searchTerm -> debouncedTerm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 600); // 0.6s pause before "search"

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 1) Navigate to /products?search=... when debouncedTerm changes
  useEffect(() => {
    const q = debouncedTerm.trim();
    if (!q) {
      setSuggestions(null);
      setSuggestionsOpen(false);
      return;
    }

    const params = new URLSearchParams();
    params.set("search", q);
    const query = params.toString();
    router.push(`/products?${query}`);
  }, [debouncedTerm, router]);

  // 2) Fetch suggestions from /api/search?q=...
  useEffect(() => {
    async function loadSuggestions() {
      const q = debouncedTerm.trim();
      if (!q || q.length < 2) {
        setSuggestions(null);
        setSuggestionsOpen(false);
        return;
      }

      try {
        setSuggestionsLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/search?q=${encodeURIComponent(q)}`
        );
        if (!res.ok) {
          throw new Error("Failed to load suggestions");
        }
        const data = (await res.json()) as SearchResult;
        setSuggestions(data);
        const hasResults =
          (data.products && data.products.length > 0) ||
          (data.categories && data.categories.length > 0) ||
          (data.vendors && data.vendors.length > 0);
        setSuggestionsOpen(hasResults);
      } catch (err) {
        console.error(err);
        setSuggestions(null);
        setSuggestionsOpen(false);
      } finally {
        setSuggestionsLoading(false);
      }
    }

    loadSuggestions();
  }, [debouncedTerm]);

  function handleProductClick(p: SearchProduct) {
    setSuggestionsOpen(false);
    setShowMobileSearch(false);
    setMobileOpen(false);
    setSearchTerm("");
    router.push(`/products/${p.id}`);
  }

  function handleCategoryClick(c: SearchCategory) {
    setSuggestionsOpen(false);
    setShowMobileSearch(false);
    setMobileOpen(false);
    setSearchTerm("");
    router.push(`/products?categoryId=${c.id}`);
  }

  function handleVendorClick(v: SearchVendor) {
    setSuggestionsOpen(false);
    setShowMobileSearch(false);
    setMobileOpen(false);
    setSearchTerm("");
    router.push(`/products?vendorId=${v.id}`);
  }

  function displayPrice(p: SearchProduct): string {
    const price = p.displayPrice ?? p.basePrice ?? 0;
    return `MK ${price.toLocaleString()}`;
  }

  const isActiveLink = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between max-w-6xl px-4 py-3 mx-auto md:px-6">
        {/* Left: logo + flag + search */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2"
            onClick={() => router.push("/")}
          >
            <div className="flex items-center justify-center text-xs font-bold text-white rounded-lg shadow-sm h-9 w-9 bg-gradient-to-br from-green-600 to-emerald-500">
              TP
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-900">
                Trade Point Malawi
              </span>
              <span className="text-[11px] text-slate-500">
                Gateway to trade in Malawi
              </span>
            </div>
          </button>

          <div className="hidden items-center gap-1 rounded-full bg-slate-50 px-2 py-[2px] text-[11px] text-slate-600 sm:flex">
            <span className="text-base">🇲🇼</span>
            <span>Proudly Malawian</span>
          </div>

          {/* Desktop search: icon + small input */}
          <div className="relative items-center hidden gap-2 px-2 py-1 text-[11px] text-slate-600 border border-slate-200 rounded-full bg-slate-50 lg:flex">
            <SearchIcon className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products, categories..."
              className="w-40 bg-transparent text-[11px] outline-none placeholder:text-slate-400"
              onFocus={() => {
                if (suggestions) setSuggestionsOpen(true);
              }}
            />

            {/* Suggestions dropdown (desktop) */}
            {suggestionsOpen && suggestions && (
              <div className="absolute left-0 top-9 z-40 w-80 rounded-xl border border-slate-200 bg-white shadow-lg text-[11px] text-slate-800">
                {suggestionsLoading && (
                  <div className="px-3 py-2 text-slate-500">Searching...</div>
                )}

                {!suggestionsLoading && (
                  <div className="overflow-auto max-h-80">
                    {/* Products */}
                    {suggestions.products &&
                      suggestions.products.length > 0 && (
                        <div className="border-b border-slate-100">
                          <p className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">
                            Products
                          </p>
                          {suggestions.products.map((p) => (
                            <button
                              key={`p-${p.id}`}
                              type="button"
                              onClick={() => handleProductClick(p)}
                              className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-slate-50"
                            >
                              <div className="flex flex-col text-left">
                                <span className="font-medium">{p.name}</span>
                                {p.category?.name && (
                                  <span className="text-[10px] text-slate-500">
                                    {p.category.name}
                                  </span>
                                )}
                                {p.district && (
                                  <span className="text-[10px] text-slate-500">
                                    {p.district}
                                    {p.area ? ` • ${p.area}` : ""}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-700">
                                {displayPrice(p)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Categories */}
                    {suggestions.categories &&
                      suggestions.categories.length > 0 && (
                        <div className="border-b border-slate-100">
                          <p className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">
                            Categories
                          </p>
                          {suggestions.categories.map((c) => (
                            <button
                              key={`c-${c.id}`}
                              type="button"
                              onClick={() => handleCategoryClick(c)}
                              className="flex items-center w-full px-3 py-1.5 hover:bg-slate-50"
                            >
                              <span className="font-medium">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Vendors */}
                    {suggestions.vendors && suggestions.vendors.length > 0 && (
                      <div>
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">
                          Vendors
                        </p>
                        {suggestions.vendors.map((v) => (
                          <button
                            key={`v-${v.id}`}
                            type="button"
                            onClick={() => handleVendorClick(v)}
                            className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-slate-50"
                          >
                            <div className="flex flex-col text-left">
                              <span className="font-medium">
                                {v.name || v.email}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {v.email}
                              </span>
                            </div>
                            <span
                              className={classNames(
                                "rounded-full px-2 py-[2px] text-[9px] font-semibold",
                                v.subscriptionActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              )}
                            >
                              {v.subscriptionActive ? "Active" : "Blocked"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="items-center hidden gap-6 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActiveLink(link.href)
                  ? "text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/sell"
            className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-full shadow-sm hover:bg-green-700"
          >
            Sell on Trade Point
          </Link>
        </nav>

        {/* Right side on mobile: search icon + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile search icon */}
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 border rounded-full text-slate-600 bg-slate-50 border-slate-200"
            aria-label="Search"
            onClick={() => {
              const next = !showMobileSearch;
              setShowMobileSearch(next);
              if (!next) setSuggestionsOpen(false);
            }}
          >
            <SearchIcon className="w-4 h-4" />
          </button>

          {/* Mobile menu button (original behaviour) */}
          <button
            className="inline-flex items-center p-1 border rounded-md border-slate-200 text-slate-600 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile search input (below header) */}
      {showMobileSearch && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 md:hidden">
          <div className="relative flex items-center gap-2 px-2 py-1 bg-white border rounded-lg border-slate-200">
            <SearchIcon className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products, categories..."
              className="w-full text-xs bg-transparent outline-none placeholder:text-slate-400"
              onFocus={() => {
                if (suggestions) setSuggestionsOpen(true);
              }}
            />

            {/* Suggestions dropdown (mobile) */}
            {suggestionsOpen && suggestions && (
              <div className="absolute left-0 top-9 z-40 w-full rounded-xl border border-slate-200 bg-white shadow-lg text-[11px] text-slate-800">
                {suggestionsLoading && (
                  <div className="px-3 py-2 text-slate-500">Searching...</div>
                )}

                {!suggestionsLoading && (
                  <div className="overflow-auto max-h-72">
                    {/* Products */}
                    {suggestions.products &&
                      suggestions.products.length > 0 && (
                        <div className="border-b border-slate-100">
                          <p className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">
                            Products
                          </p>
                          {suggestions.products.map((p) => (
                            <button
                              key={`mp-${p.id}`}
                              type="button"
                              onClick={() => handleProductClick(p)}
                              className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-slate-50"
                            >
                              <span className="font-medium text-left">
                                {p.name}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-700">
                                {displayPrice(p)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Categories */}
                    {suggestions.categories &&
                      suggestions.categories.length > 0 && (
                        <div className="border-b border-slate-100">
                          <p className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">
                            Categories
                          </p>
                          {suggestions.categories.map((c) => (
                            <button
                              key={`mc-${c.id}`}
                              type="button"
                              onClick={() => handleCategoryClick(c)}
                              className="flex items-center w-full px-3 py-1.5 hover:bg-slate-50"
                            >
                              <span className="font-medium">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Vendors */}
                    {suggestions.vendors && suggestions.vendors.length > 0 && (
                      <div>
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">
                          Vendors
                        </p>
                        {suggestions.vendors.map((v) => (
                          <button
                            key={`mv-${v.id}`}
                            type="button"
                            onClick={() => handleVendorClick(v)}
                            className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-slate-50"
                          >
                            <span className="font-medium text-left">
                              {v.name || v.email}
                            </span>
                            <span
                              className={`rounded-full px-2 py-[2px] text-[9px] font-semibold ${
                                v.subscriptionActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {v.subscriptionActive ? "Active" : "Blocked"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile nav (original behaviour) */}
      {mobileOpen && (
        <div className="bg-white border-t border-slate-100 md:hidden">
          <nav className="flex flex-col max-w-6xl gap-1 px-4 py-3 mx-auto text-sm font-medium text-slate-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActiveLink(link.href)
                    ? "rounded-md bg-slate-50 px-3 py-2"
                    : "rounded-md px-3 py-2 hover:bg-slate-50"
                }
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/sell"
              className="px-3 py-2 mt-2 text-xs font-semibold text-center text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700"
              onClick={() => setMobileOpen(false)}
            >
              Sell on Trade Point
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

/* Simple magnifying glass icon (no extra library) */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.167 14.167L17.5 17.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle
        cx="9.167"
        cy="9.167"
        r="4.667"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
