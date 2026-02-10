// website/src/app/about/page.tsx
export default function AboutPage() {
  return (
    <div className="pb-10 space-y-4">
      <h1 className="text-2xl font-bold text-text-main">
        About Trade Point Malawi
      </h1>
      <p className="text-lg text-text-muted">
        Trade Point Malawi is a local-first marketplace built to help Malawian
        businesses and individuals trade more reliably across all districts.
      </p>

      <section className="space-y-2 leading-relaxed text-md text-text-muted">
        <p>
          Our goal is to bring together vendors and buyers in a single, trusted
          platform that reflects the way Malawi actually trades – from city
          centres to rural markets.
        </p>
        <p>
          Vendors manage their listings through a dedicated admin panel, where
          they can add products, track orders, and see commission and
          subscription status. Buyers access the website to browse products by
          district, category, or keyword, and send purchase requests directly to
          vendors.
        </p>
        <p>
          Behind the scenes, the system tracks commission, subscription
          payments, and vendor performance, giving the platform a professional
          backbone while still being simple to use.
        </p>
      </section>
    </div>
  );
}
