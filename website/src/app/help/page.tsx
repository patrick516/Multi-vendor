// website/src/app/help/page.tsx
export default function HelpPage() {
  return (
    <div className="pb-10 space-y-4 text-lg">
      <h1 className="text-2xl font-bold text-text-main">Help &amp; FAQ</h1>
      <p className="text-lg text-text-muted">
        Common questions about using Trade Point Malawi as a buyer or vendor.
      </p>

      <section className="space-y-3 text-lg leading-relaxed text-text-muted">
        <div>
          <h2 className="text-lg font-semibold text-text-main">
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
            How do vendors pay the subscription fee?
          </h2>
          <p className="text-lg text-text-muted">
            Vendors don’t pay commission per product. Instead, each vendor pays
            a fixed monthly subscription fee to keep their account active and
            their products visible on Trade Point Malawi. Payment is made using
            the admin&apos;s published accounts (for example TNM Mpamba, Airtel
            Money or bank account), and the admin marks the vendor as{" "}
            <span className="font-semibold">paid</span> in the back-office.
          </p>
          <p className="mt-1 text-md text-text-muted">
            After payment is approved, the system sets the next due date
            (usually 30 days from the last payment). Vendors receive reminder
            emails a few days before the due date, and accounts that are not
            renewed on time are automatically blocked until the subscription is
            paid again. Buyers always see the full price set by the vendor –
            there is no extra commission added on top.
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
