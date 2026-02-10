// website/src/app/how-it-works/page.tsx
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-text-main">How it works</h1>
        <p className="text-sm text-text-muted">
          Trade Point Malawi connects vendors, admin and customers in one
          workflow.
        </p>
      </header>

      <section className="space-y-3 text-sm text-text-muted">
        <div className="p-4 space-y-2 border rounded-lg bg-bg-light border-gray-soft">
          <h2 className="text-sm font-semibold text-text-main">
            1. Admin & vendors manage products
          </h2>
          <p>
            Admin creates vendor accounts and vendors add their products from
            the backoffice panel. Each product has a base price for the vendor
            and an extra commission amount for the admin.
          </p>
        </div>

        <div className="p-4 space-y-2 border rounded-lg bg-bg-light border-gray-soft">
          <h2 className="text-sm font-semibold text-text-main">
            2. Products appear on this website
          </h2>
          <p>
            As soon as a product is created and activated, it becomes visible on
            this website. When the vendor marks it as sold, the available
            quantity here is reduced or the item is marked out of stock.
          </p>
        </div>

        <div className="p-4 space-y-2 border rounded-lg bg-bg-light border-gray-soft">
          <h2 className="text-sm font-semibold text-text-main">
            3. Customers add items to cart as a request
          </h2>
          <p>
            When a customer clicks &quot;Add to cart&quot;, we collect their
            contact details and notify the admin and vendor by email so they can
            complete the business offline (phone, mobile money, or bank).
          </p>
        </div>

        <div className="p-4 space-y-2 border rounded-lg bg-bg-light border-gray-soft">
          <h2 className="text-sm font-semibold text-text-main">
            4. Admin tracks commission and payments
          </h2>
          <p>
            For each sold product, the system calculates admin commission and
            lets the admin track what has been paid and what is still pending
            per vendor.
          </p>
        </div>
      </section>

      <Link
        href="/products"
        className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-md bg-brand-green hover:bg-brand-greenLight"
      >
        Browse products
      </Link>
    </div>
  );
}
