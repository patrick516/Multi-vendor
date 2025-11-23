// website/src/app/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-slate-100 bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 text-[11px] text-slate-600 md:flex-row md:items-start md:justify-between md:px-6">
        {/* Brand */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 text-[10px] font-bold text-white">
              TP
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-slate-900">
                Trade Point Malawi
              </span>
              <span className="text-[11px] text-slate-500">
                Gateway to trade in Malawi
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-[2px]">
            <span className="text-base">🇲🇼</span>
            <span>Proudly Malawian marketplace</span>
          </div>
          <p className="text-[11px] text-slate-500">
            © {year} Trade Point Malawi. All rights reserved.
          </p>
        </div>

        {/* Links columns */}
        <div className="grid flex-1 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-900">
              Marketplace
            </p>
            <ul className="space-y-1">
              <li>
                <Link href="/products" className="hover:text-slate-900">
                  Browse products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-slate-900">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/#filter-bar" className="hover:text-slate-900">
                  Search by district
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-900">Support</p>
            <ul className="space-y-1">
              <li>
                <Link href="/help" className="hover:text-slate-900">
                  Help &amp; FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-slate-900">
                  About Trade Point
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@multivendor.com"
                  className="hover:text-slate-900"
                >
                  Email support
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-900">Legal</p>
            <ul className="space-y-1">
              <li>
                <Link href="/terms" className="hover:text-slate-900">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-slate-900">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
