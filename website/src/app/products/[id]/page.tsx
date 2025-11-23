// website/src/app/products/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";

import type { Product } from "@/app/features/products/types";
import { API_BASE_URL } from "@/app/utils/fetcher";
import ProductCard from "@/app/features/products/ProductCard";

// Load LeafletMap client-side only
const LeafletMap = dynamic(() => import("@/app/features/products/LeafletMap"), {
  ssr: false,
});

interface LatLng {
  lat: number;
  lng: number;
}

const CUSTOMER_INFO_KEY = "tp_customer_info";

function loadCustomerInfo() {
  if (typeof window === "undefined") return { name: "", email: "", phone: "" };
  const raw = localStorage.getItem(CUSTOMER_INFO_KEY);
  if (!raw) return { name: "", email: "", phone: "" };
  try {
    const parsed = JSON.parse(raw) as {
      name?: string;
      email?: string;
      phone?: string;
    };
    return {
      name: parsed.name || "",
      email: parsed.email || "",
      phone: parsed.phone || "",
    };
  } catch {
    return { name: "", email: "", phone: "" };
  }
}

function saveCustomerInfo(name: string, email: string, phone: string) {
  if (typeof window === "undefined") return;
  const payload = { name, email, phone };
  localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(payload));
}

// Haversine distance in km
function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const c =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const d = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));

  return R * d;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showBuyNow, setShowBuyNow] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch product details + similar products
  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError("Invalid product id");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/products/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load product");
        }

        const data = (await res.json()) as Product;
        setProduct(data);

        // Load similar products from same category or district
        const resAll = await fetch(`${API_BASE_URL}/products`, {
          cache: "no-store",
        });
        if (resAll.ok) {
          const all = (await resAll.json()) as Product[];
          const similarProducts = all
            .filter((p) => p.id !== data.id)
            .filter((p) => {
              if (data.category && p.category?.id === data.category.id)
                return true;
              if (data.district && p.district === data.district) return true;
              return false;
            })
            .slice(0, 4);
          setSimilar(similarProducts);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Get user location & distance
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (
          product &&
          typeof product.latitude === "number" &&
          typeof product.longitude === "number"
        ) {
          const dist = haversineDistance(loc, {
            lat: product.latitude,
            lng: product.longitude,
          });
          setDistanceKm(dist);
        }
      },
      () => {
        // ignore
      }
    );
  }, [product]);

  // Update distance if product or userLocation changes
  useEffect(() => {
    if (
      userLocation &&
      product &&
      typeof product.latitude === "number" &&
      typeof product.longitude === "number"
    ) {
      const dist = haversineDistance(userLocation, {
        lat: product.latitude,
        lng: product.longitude,
      });
      setDistanceKm(dist);
    }
  }, [userLocation, product]);

  if (loading) {
    return (
      <div className="pb-10 space-y-3">
        <p className="text-sm text-text-muted">Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pb-10 space-y-3">
        <p className="text-sm text-red-500">{error || "Product not found."}</p>
        <button
          onClick={() => router.push("/products")}
          className="px-4 py-2 text-xs font-semibold text-white rounded-md bg-brand-green hover:bg-brand-greenLight"
        >
          Back to products
        </button>
      </div>
    );
  }

  const images = [
    product.mainImageUrl || product.imageUrl,
    ...(product.galleryImageUrls || []),
  ].filter(Boolean) as string[];

  const activeImage = images[activeImageIndex] || images[0] || "/file.svg";

  const displayPrice =
    product.displayPrice ?? product.price ?? product.basePrice ?? 0;

  const categoryLabel = product.category?.name || "General products";
  const districtLabel = product.district || "Malawi";
  const vendorName = product.vendor?.name || product.vendor?.email || "Vendor";

  const outOfStock = (product.stock ?? 0) <= 0;

  const distanceLabel =
    distanceKm !== null ? `${distanceKm.toFixed(1)} km away` : null;

  const canShowMap =
    typeof product.latitude === "number" &&
    typeof product.longitude === "number";

  const center: LatLngExpression | null =
    canShowMap && product.latitude && product.longitude
      ? [product.latitude, product.longitude]
      : null;

  return (
    <div className="pb-10 space-y-6">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/products")}
          className="text-[11px] text-text-muted hover:text-text-main"
        >
          ← Back to products
        </button>
      </div>

      {/* Main detail card */}
      <section className="p-4 space-y-4 bg-white shadow-sm rounded-3xl ring-1 ring-slate-100 md:p-6">
        {/* Breadcrumb / category */}
        <div className="text-[11px] text-text-muted">
          <span className="font-medium">{categoryLabel}</span>{" "}
          <span className="text-slate-400">•</span> <span>Products</span>
        </div>

        {/* Top layout: image + info */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)]">
          {/* Images */}
          <div className="space-y-3">
            <div className="w-full overflow-hidden rounded-2xl bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt={product.name}
                className="object-cover w-full h-72 md:h-80"
              />
            </div>

            {images.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {images.map((src, idx) => {
                  const isActive = idx === activeImageIndex;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onMouseEnter={() => setActiveImageIndex(idx)}
                      onFocus={() => setActiveImageIndex(idx)}
                      onClick={() => setActiveImageIndex(idx)}
                      className={[
                        "h-16 w-16 overflow-hidden rounded-lg border bg-slate-50 transition",
                        isActive
                          ? "border-emerald-500 ring-1 ring-emerald-500"
                          : "border-slate-200 hover:border-emerald-300",
                      ].join(" ")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${product.name} ${idx + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info pane */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-text-main md:text-3xl">
                {product.name}
              </h1>
              <p className="text-xl font-semibold text-slate-900">
                MWK {displayPrice.toLocaleString()}
              </p>
            </div>

            {/* Location + vendor */}
            <div className="space-y-1 text-[11px] text-text-muted">
              <div className="flex items-center gap-2">
                <span className="text-base">📍</span>
                <span>
                  {districtLabel}
                  {product.area ? ` • ${product.area}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base text-emerald-600">●</span>
                <span>{vendorName}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={[
                    "mt-1 inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-medium",
                    outOfStock
                      ? "bg-slate-100 text-slate-500"
                      : "bg-emerald-50 text-emerald-700",
                  ].join(" ")}
                >
                  {outOfStock ? "Out of stock" : "In stock"}
                </span>
                {distanceLabel && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] font-medium text-emerald-700">
                    {distanceLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => setShowBuyNow(true)}
                className="rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                type="button"
                onClick={() => setShowContact(true)}
                className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Contact Vendor
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-slate-100" />

        {/* Description + Vendor card */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr),minmax(0,0.9fr)]">
          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-text-main">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">
              {product.description ||
                "No detailed description has been provided for this product yet. Contact the vendor for more information about features, condition, and availability."}
            </p>

            <div className="mt-3 space-y-2">
              <h3 className="text-sm font-semibold text-text-main">
                Product details
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-[11px] text-text-muted">
                <li>Category: {categoryLabel}</li>
                <li>
                  Location: {districtLabel}
                  {product.area ? `, ${product.area}` : ""}
                </li>
                <li>Stock available: {product.stock ?? 0}</li>
              </ul>
            </div>
          </div>

          {/* Vendor card */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-text-main">Vendor</h2>
            <div className="flex items-center justify-between px-3 py-3 border rounded-2xl border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 text-xs font-semibold text-white rounded-full bg-emerald-600">
                  {vendorName.charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-text-main">
                    {vendorName}
                  </p>
                  <p className="text-[11px] text-text-muted">Verified vendor</p>
                  <p className="text-[11px] text-text-muted">{districtLabel}</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700"
              >
                View profile
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Location map section */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-text-main">Location</h2>
        <p className="text-[11px] text-text-muted">
          Approximate location provided by the vendor. Use this to estimate how
          far the product is from you.
        </p>

        {!center ? (
          <div className="flex h-[260px] w-full items-center justify-center rounded-xl border border-gray-soft bg-gray-soft text-[11px] text-text-muted">
            No map location provided for this product.
          </div>
        ) : (
          <LeafletMap center={center} userLocation={userLocation} />
        )}
      </section>

      {/* Similar products */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text-main">
          Similar products
        </h2>
        {similar.length === 0 && (
          <p className="text-sm text-text-muted">
            No similar products found at the moment.
          </p>
        )}
        {similar.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* BUY NOW MODAL */}
      {showBuyNow && (
        <BuyNowModal product={product} onClose={() => setShowBuyNow(false)} />
      )}

      {/* CONTACT VENDOR MODAL */}
      {showContact && (
        <ContactVendorModal
          product={product}
          onClose={() => setShowContact(false)}
        />
      )}
    </div>
  );
}

/* ---------- BUY NOW MODAL ---------- */

function BuyNowModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const initialInfo = loadCustomerInfo();

  const [customerName, setCustomerName] = useState(initialInfo.name);
  const [customerEmail, setCustomerEmail] = useState(initialInfo.email);
  const [customerPhone, setCustomerPhone] = useState(initialInfo.phone);

  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const maxQty = product.stock ?? undefined;
  const vendorLabel =
    product.vendor?.name || product.vendor?.email || "the vendor";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName) {
      setError("Please enter your name.");
      return;
    }
    if (quantity <= 0) {
      setError("Quantity must be at least 1.");
      return;
    }
    if (maxQty !== undefined && quantity > maxQty) {
      setError(`Only ${maxQty} units are available.`);
      return;
    }

    const ok = window.confirm(
      `You are placing a BUY NOW request for ${quantity} x "${product.name}". ${vendorLabel} will contact you to complete the purchase. Continue?`
    );
    if (!ok) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/orders/buy-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          customerName,
          customerEmail,
          customerPhone,
          note,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to send buy now request");
      }
      saveCustomerInfo(customerName, customerEmail, customerPhone);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Failed to send buy now request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="w-full max-w-md p-4 space-y-3 bg-white shadow-lg rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-main">
            Buy now – {product.name}
          </h3>
          <button
            onClick={onClose}
            className="text-xs text-text-muted hover:text-text-main"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] text-text-muted">
          Fill in your details to place a BUY NOW request. The vendor will
          contact you to confirm availability, payment, and delivery.
        </p>

        {error && <p className="text-[11px] text-red-500">{error}</p>}
        {success && (
          <p className="text-[11px] text-green-600">
            Your buy now request has been sent!
          </p>
        )}

        <form className="space-y-2" onSubmit={handleSubmit}>
          {/* name, phone, email, quantity, note fields */}
          {/* ...same as your current implementation... */}
        </form>
      </div>
    </div>
  );
}

/* ---------- CONTACT VENDOR MODAL ---------- */

function ContactVendorModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const initialInfo = loadCustomerInfo();

  const [customerName, setCustomerName] = useState(initialInfo.name);
  const [customerEmail, setCustomerEmail] = useState(initialInfo.email);
  const [customerPhone, setCustomerPhone] = useState(initialInfo.phone);

  const [message, setMessage] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const vendorLabel =
    product.vendor?.name || product.vendor?.email || "the vendor";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName) {
      setError("Please enter your name.");
      return;
    }

    const ok = window.confirm(
      `You are contacting ${vendorLabel} about "${product.name}". Continue?`
    );
    if (!ok) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/orders/contact-vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          customerName,
          customerEmail,
          customerPhone,
          note: message,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to send message");
      }
      saveCustomerInfo(customerName, customerEmail, customerPhone);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="w-full max-w-md p-4 space-y-3 bg-white shadow-lg rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-main">
            Contact {vendorLabel}
          </h3>
          <button
            onClick={onClose}
            className="text-xs text-text-muted hover:text-text-main"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] text-text-muted">
          Ask a question, negotiate price, or request more information about
          this product before you decide to buy.
        </p>

        {error && <p className="text-[11px] text-red-500">{error}</p>}
        {success && (
          <p className="text-[11px] text-green-600">
            Your message has been sent!
          </p>
        )}

        <form className="space-y-2" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-[11px] font-medium">Your name *</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-gray-soft bg-bg-light"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium">
              Phone (for call / WhatsApp)
            </label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-gray-soft bg-bg-light"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium">Email (optional)</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-gray-soft bg-bg-light"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium">Your message</label>
            <textarea
              className="w-full px-3 py-2 text-sm border rounded-md border-gray-soft bg-bg-light"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-xs text-text-muted hover:bg-gray-200"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Sending..." : "Send message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
