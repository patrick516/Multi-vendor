// src/app/page.tsx
import Link from "next/link";
import ProductList from "./features/products/ProductList";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero section */}
      <section className="grid gap-6 md:grid-cols-[1.2fr,1fr] items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/20 border border-brand-yellow/40 text-[11px] text-brand-yellowDark">
            <span className="h-2 w-2 rounded-full bg-brand-green"></span>
            <span>Multi-vendor marketplace</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-text-main leading-tight">
            Discover products from trusted vendors in one place.
          </h1>

          <p className="text-sm text-text-muted max-w-md">
            Browse cars, gadgets, and more from verified vendors. Every listing
            is managed through our secure backoffice so you always know who
            you’re dealing with.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="px-5 py-2.5 rounded-md bg-brand-green text-white text-sm font-semibold hover:bg-brand-greenLight transition-colors"
            >
              Browse products
            </Link>
            <Link
              href="/how-it-works"
              className="px-5 py-2.5 rounded-md border border-brand-green text-brand-green text-sm font-semibold hover:bg-brand-green/5 transition-colors"
            >
              Learn more
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-brand-green/10 via-brand-yellow/10 to-accent-blue/10 border border-gray-soft p-5 flex flex-col justify-between gap-4">
          <div>
            <p className="text-xs text-text-muted mb-1">Live snapshot</p>
            <h2 className="text-lg font-semibold text-text-main">
              Powered by vendor panel
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Everything you see here is coming directly from the admin & vendor
              dashboard. When vendors add a product, it appears here
              automatically.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg bg-bg-light border border-gray-soft py-3 px-2">
              <p className="text-[11px] text-text-muted">Vendors</p>
              <p className="text-lg font-bold text-brand-green">Live</p>
            </div>
            <div className="rounded-lg bg-bg-light border border-gray-soft py-3 px-2">
              <p className="text-[11px] text-text-muted">Products</p>
              <p className="text-lg font-bold text-brand-yellow">Synced</p>
            </div>
            <div className="rounded-lg bg-bg-light border border-gray-soft py-3 px-2">
              <p className="text-[11px] text-text-muted">Revenue</p>
              <p className="text-lg font-bold text-accent-blue">Tracked</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest products */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-main">
            Latest products
          </h2>
          <Link
            href="/products"
            className="text-xs text-brand-green hover:underline"
          >
            View all
          </Link>
        </div>
        <ProductList />
      </section>
    </div>
  );
}
