// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
// import ScrollTopButton from "./components/ScrollTopButton";
// import DistrictSelector from "./components/DistrictSelector";

export const metadata: Metadata = {
  title: "Trade Point Malawi",
  description: "Gateway to trade in Malawi and beyond",
  // icons: {
  //   icon: "/tp_logo.svg",
  //   shortcut: "/tp_logo.svg",
  //   apple: "/tp_logo.svg",
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F6FAF7] text-slate-900">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className="max-w-6xl px-4 pt-4 pb-10 mx-auto md:px-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
