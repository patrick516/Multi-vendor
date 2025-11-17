"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Browse Products" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [term, setTerm] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);

  // Keep search term synced with ?q=
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setTerm(q);
  }, [searchParams]);

  // Auto-search on /products when term changes (debounced)
  useEffect(() => {
    // Only auto-search on the products page
    if (!pathname.startsWith("/products")) return;

    const handler = setTimeout(() => {
      const value = term.trim();
      if (!value) {
        router.push("/products");
      } else {
        router.push(`/products?q=${encodeURIComponent(value)}`);
      }
    }, 300); // small delay to avoid firing on every keystroke

    return () => clearTimeout(handler);
  }, [term, pathname, router]);

  // Close mobile search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setMobileSearchOpen(false);
      }
    }

    if (mobileSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileSearchOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-soft bg-bg-light/90 backdrop-blur-md">
      <div className="flex items-center max-w-6xl gap-4 px-4 py-3 mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center text-xs font-bold rounded-full h-9 w-9 bg-brand-yellow text-brand-green">
            MV
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-text-main">
              Multi Vendor Shop
            </p>
            <p className="text-[11px] text-text-muted">
              Discover products from multiple vendors
            </p>
          </div>
        </Link>

        {/* Desktop Search (center) */}
        <div className="flex-1 hidden md:flex">
          <input
            type="text"
            placeholder="Search products (e.g. Toyota, headphones, pot)..."
            className="w-full px-3 py-2 text-sm border rounded-md border-gray-soft bg-bg-light text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green/50"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        {/* Nav links (always visible) */}
        <nav className="flex items-center gap-4 ml-auto text-sm md:ml-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "transition-colors",
                  isActive
                    ? "text-brand-green font-semibold"
                    : "text-text-muted hover:text-text-main",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Search icon (mobile only) */}
          <button
            className="p-2 md:hidden text-text-main"
            onClick={() => {
              // ensure we’re on /products when opening search
              if (!pathname.startsWith("/products")) {
                router.push("/products");
              }
              setMobileSearchOpen((prev) => !prev);
            }}
            aria-label="Search"
          >
            {/* simple magnifying glass icon SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 0-0-15 7.5 7.5 0 0 0 0 15z"
              />
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile search drawer (only icon on header; input appears here) */}
      {mobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="px-4 py-3 border-t md:hidden bg-bg-light border-gray-soft animate-slide-down"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Search products..."
              className="flex-1 px-3 py-2 text-sm border rounded-md border-gray-soft bg-bg-light text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green/50"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />

            <button
              className="p-2 text-text-muted hover:text-text-main"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close search"
            >
              {/* X icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
