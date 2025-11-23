// website/src/app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Browse Products" },
  { href: "/categories", label: "Categories" }, // you can add this page later
  { href: "/about", label: "About" }, // same here
  { href: "/help", label: "Help / FAQ" }, // same here
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between max-w-6xl px-4 py-3 mx-auto md:px-6">
        {/* Left: logo + flag */}
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
        </div>

        {/* Desktop nav */}
        <nav className="items-center hidden gap-6 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
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

        {/* Mobile menu button */}
        <button
          className="inline-flex items-center p-1 border rounded-md border-slate-200 text-slate-600 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className="text-base material-icons">
            {mobileOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="bg-white border-t border-slate-100 md:hidden">
          <nav className="flex flex-col max-w-6xl gap-1 px-4 py-3 mx-auto text-sm font-medium text-slate-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  pathname === link.href
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
