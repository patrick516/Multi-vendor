// website/src/app/page.tsx
import Link from "next/link";
import ProductList from "./features/products/ProductList";
import { API_BASE_URL } from "./utils/fetcher";

interface PublicStats {
  totalVendors: number;
  vendorsSellingNow: number;
  totalActiveProducts: number;
  productsInStock: number;
  totalAdminCommission: number;
  currency: string;
  totalCartLeads: number;
  recentCartLeads: number;
}

async function fetchStats(): Promise<PublicStats | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/stats`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicStats;
  } catch {
    return null;
  }
}

export default async function Home() {
  const stats = await fetchStats();

  const vendorsSellingNow = stats?.vendorsSellingNow ?? 0;
  const totalVendors = stats?.totalVendors ?? 0;
  const productsInStock = stats?.productsInStock ?? 0;
  const totalAdminCommission = stats?.totalAdminCommission ?? 0;
  const recentCartLeads = stats?.recentCartLeads ?? 0;
  const currency = stats?.currency ?? "MWK";

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <section className="grid gap-6 md:grid-cols-[1.2fr,1fr] items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/20 border border-brand-yellow/40 text-[11px] text-brand-yellowDark">
            <span className="w-2 h-2 rounded-full bg-brand-green"></span>
            <span>Multi-vendor marketplace</span>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl text-text-main">
            Discover products from trusted vendors in one place.
          </h1>

          <p className="max-w-md text-sm text-text-muted">
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

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 pt-2 text-[11px] text-text-muted">
            <span className="px-3 py-1 border rounded-full bg-bg-light border-gray-soft">
              ✔ Vendors verified by admin
            </span>
            <span className="px-3 py-1 border rounded-full bg-bg-light border-gray-soft">
              ✔ Commission & sales tracked in dashboard
            </span>
          </div>
        </div>

        {/* Live snapshot card */}
        <div className="flex flex-col justify-between gap-4 p-5 border rounded-2xl bg-gradient-to-br from-brand-green/10 via-brand-yellow/10 to-accent-blue/10 border-gray-soft">
          <div>
            <p className="mb-1 text-xs text-text-muted">Live snapshot</p>
            <h2 className="text-lg font-semibold text-text-main">
              Powered by vendor panel
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Everything you see here comes directly from the admin &amp; vendor
              dashboard. When vendors add or sell a product, the catalog and
              stats update automatically.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs text-center">
            <div className="px-2 py-3 border rounded-lg bg-bg-light border-gray-soft">
              <p className="text-[11px] text-text-muted">Vendors</p>
              <p className="text-lg font-bold text-brand-green">
                {vendorsSellingNow}
              </p>
              <p className="text-[10px] text-text-muted">
                {totalVendors > 0
                  ? `active out of ${totalVendors}`
                  : "active sellers"}
              </p>
            </div>
            <div className="px-2 py-3 border rounded-lg bg-bg-light border-gray-soft">
              <p className="text-[11px] text-text-muted">Products</p>
              <p className="text-lg font-bold text-brand-yellow">
                {productsInStock}
              </p>
              <p className="text-[10px] text-text-muted">in stock right now</p>
            </div>
            <div className="px-2 py-3 border rounded-lg bg-bg-light border-gray-soft">
              <p className="text-[11px] text-text-muted">Customer Requests</p>
              <p className="text-lg font-bold text-accent-blue">
                {recentCartLeads}
              </p>
              <p className="text-[10px] text-text-muted">
                interested buyers this month
              </p>
            </div>
          </div>

          {recentCartLeads > 0 && (
            <p className="text-[11px] text-text-muted text-center mt-1">
              In the last 30 days we received{" "}
              <span className="font-semibold text-text-main">
                {recentCartLeads}
              </span>{" "}
              cart requests from buyers.
            </p>
          )}
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
