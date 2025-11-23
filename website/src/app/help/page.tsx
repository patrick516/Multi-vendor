// website/src/app/help/page.tsx
export default function HelpPage() {
  return (
    <div className="pb-10 space-y-4">
      <h1 className="text-2xl font-bold text-text-main">Help &amp; FAQ</h1>
      <p className="text-sm text-text-muted">
        Common questions about using Trade Point Malawi as a buyer or vendor.
      </p>

      <section className="space-y-3 text-sm leading-relaxed text-text-muted">
        <div>
          <h2 className="text-base font-semibold text-text-main">
            How do I buy something?
          </h2>
          <p>
            Browse products by district and category, then click &quot;Add to
            cart&quot; or &quot;Send request&quot; on a product. Fill in your
            contact details and the vendor will contact you to confirm price,
            delivery, and payment.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-text-main">
            How do I become a vendor?
          </h2>
          <p>
            Vendors are onboarded and managed by the platform admin. To request
            a vendor account, please contact the team using the email address in
            the footer or through the Sell on Trade Point link.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-text-main">
            How is commission handled?
          </h2>
          <p>
            Vendors set their own base prices. The platform applies a small
            commission on top, which is tracked in the admin dashboard and
            visible in the commissions reports. Buyers see the full price and
            are not charged extra beyond the agreed amount.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-text-main">
            What happens if a vendor doesn&apos;t respond?
          </h2>
          <p>
            Vendors are encouraged to respond quickly to buyer requests. If a
            vendor repeatedly ignores requests or acts dishonestly, their
            account may be reviewed or suspended by the admin.
          </p>
        </div>
      </section>
    </div>
  );
}
