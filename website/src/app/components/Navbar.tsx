// src/app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Browse Products" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-gray-soft bg-bg-light/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-brand-yellow flex items-center justify-center text-xs font-bold text-brand-green">
            MV
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-text-main">
              Multi Vendor Shop
            </p>
            <p className="text-[11px] text-text-muted">
              Discover products from multiple vendors
            </p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-4 text-sm">
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
        </nav>
      </div>
    </header>
  );
}
