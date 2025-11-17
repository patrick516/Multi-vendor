import "./globals.css";
import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollTopButton from "./components/ScrollTopButton";

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
      <body className="flex flex-col min-h-screen bg-bg-light text-text-main">
        <Navbar />
        <main className="flex-1 bg-bg-soft">
          <div className="max-w-6xl px-4 py-6 mx-auto lg:py-10">{children}</div>
        </main>
        <Footer />
        <ScrollTopButton />
      </body>
    </html>
  );
}
