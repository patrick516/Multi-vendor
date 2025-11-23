// website/src/app/terms/page.tsx
export default function TermsPage() {
  return (
    <div className="pb-10 space-y-4">
      <h1 className="text-2xl font-bold text-text-main">
        Terms &amp; Conditions
      </h1>
      <p className="text-sm text-text-muted">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <section className="space-y-2 text-sm leading-relaxed text-text-muted">
        <p>
          Trade Point Malawi (&quot;we&quot;, &quot;us&quot;, or &quot;the
          platform&quot;) is an online marketplace that connects buyers and
          vendors across Malawi. By using this website, you agree to the
          following terms and conditions.
        </p>

        <h2 className="mt-3 text-base font-semibold text-text-main">
          1. Role of the platform
        </h2>
        <p>
          Trade Point Malawi is a listing and communication platform. We do not
          own or directly sell the products listed. All products are offered by
          independent vendors who are responsible for their stock, pricing, and
          delivery arrangements.
        </p>

        <h2 className="mt-3 text-base font-semibold text-text-main">
          2. Vendor responsibilities
        </h2>
        <ul className="pl-5 space-y-1 list-disc">
          <li>Provide accurate product information, pricing, and location.</li>
          <li>Respond to customer requests in a timely manner.</li>
          <li>
            Honour agreed terms with customers regarding delivery, returns, and
            warranties.
          </li>
          <li>
            Comply with all applicable Malawian laws, including tax and consumer
            protection requirements.
          </li>
        </ul>

        <h2 className="mt-3 text-base font-semibold text-text-main">
          3. Buyer responsibilities
        </h2>
        <ul className="pl-5 space-y-1 list-disc">
          <li>Provide correct contact details when sending a request.</li>
          <li>
            Deal respectfully and honestly with vendors and other platform
            users.
          </li>
          <li>
            Verify product details and suitability before making any payment.
          </li>
        </ul>

        <h2 className="mt-3 text-base font-semibold text-text-main">
          4. Subscription &amp; commission
        </h2>
        <p>
          Vendors may be required to pay a monthly subscription fee to keep
          their accounts active. Where applicable, commission on sales is
          calculated and recorded inside the admin panel. Failure to pay
          subscription by the due date may result in temporary suspension of the
          vendor account until payment is confirmed.
        </p>

        <h2 className="mt-3 text-base font-semibold text-text-main">
          5. Prohibited content &amp; activities
        </h2>
        <p>
          Vendors must not list illegal goods, fraudulent offers, or misleading
          information. Trade Point Malawi reserves the right to remove
          inappropriate listings and suspend accounts that violate these terms.
        </p>

        <h2 className="mt-3 text-base font-semibold text-text-main">
          6. Limitation of liability
        </h2>
        <p>
          While we aim to verify vendors and provide a safe environment, Trade
          Point Malawi does not guarantee the quality, safety, or legality of
          products. Any agreements between customers and vendors are handled
          directly between those parties.
        </p>

        <h2 className="mt-3 text-base font-semibold text-text-main">
          7. Changes to these terms
        </h2>
        <p>
          We may update these Terms &amp; Conditions from time to time. Any
          changes will be posted on this page with an updated &quot;Last
          updated&quot; date.
        </p>

        <h2 className="mt-3 text-base font-semibold text-text-main">
          8. Contact
        </h2>
        <p>
          For questions about these terms or to report a concern, please contact
          us at{" "}
          <a
            href="mailto:support@multivendor.com"
            className="text-brand-green hover:text-brand-green-dark"
          >
            support@multivendor.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
