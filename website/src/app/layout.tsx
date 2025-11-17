// src/app/layout.tsx

import "./globals.css";
import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "Multi Vendor Shop",
  description: "A modern multi-vendor marketplace.",
  icons: {
    icon: "/logo.svg", // <--- IMPORTANT
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg-light text-text-main min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-bg-soft">
          <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
