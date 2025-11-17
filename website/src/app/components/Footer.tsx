// src/app/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-soft bg-bg-light">
      <div className="flex flex-col items-center justify-between max-w-6xl gap-2 px-4 py-4 mx-auto sm:flex-row">
        <p className="text-[11px] text-text-muted">
          © {new Date().getFullYear()} Multi Vendor Shop. All rights reserved.
        </p>
        <p className="text-[11px] text-text-muted">
          Powered by{" "}
          <a
            href="https://tranptech.wuaze.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-green hover:underline"
          >
            tranptech
          </a>
        </p>
      </div>
    </footer>
  );
}
