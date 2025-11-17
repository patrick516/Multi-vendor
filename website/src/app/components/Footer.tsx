// src/app/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-soft bg-bg-light">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[11px] text-text-muted">
          © {new Date().getFullYear()} Multi Vendor Shop. All rights reserved.
        </p>
        <p className="text-[11px] text-text-muted">
          Powered by{" "}
          <span className="font-semibold text-brand-green">Magic Code</span>
        </p>
      </div>
    </footer>
  );
}
