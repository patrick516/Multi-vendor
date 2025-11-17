"use client";

import { useState } from "react";
import type { Product } from "./types";
import { API_BASE_URL } from "@/app/utils/fetcher";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const displayPrice =
    product.displayPrice ?? product.price ?? product.basePrice ?? 0;

  // Build full image list: main/cover first, then gallery
  const images = [
    product.mainImageUrl || product.imageUrl,
    ...(product.galleryImageUrls || []),
  ].filter(Boolean) as string[];

  const [activeIndex, setActiveIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [hovered, setHovered] = useState(false);

  const activeImage = images[activeIndex] || "/file.svg";
  const hasGallery = images.length > 1;
  const outOfStock = (product.stock ?? 0) <= 0;

  function handleNextImage() {
    if (!hasGallery) return;
    setActiveIndex((prev) => {
      const next = prev + 1;
      return next >= images.length ? 0 : next;
    });
  }

  function handleThumbClick(idx: number) {
    setActiveIndex(idx);
  }

  function handleMouseLeave() {
    setHovered(false);
    setActiveIndex(0); // reset to main image
  }

  return (
    <div className="relative flex flex-col gap-3 p-4 transition-shadow border shadow-sm border-gray-soft bg-bg-light rounded-xl hover:shadow-md">
      {/* IMAGE + HOVER GALLERY */}
      <div
        className="relative w-full h-40 overflow-hidden rounded-lg bg-gray-soft"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={product.name}
          className="object-cover w-full h-full transition-transform duration-200"
        />

        {/* Thumbnails overlay (only show when hovered and there is gallery) */}
        {hovered && hasGallery && (
          <>
            <div className="absolute flex gap-1 px-1 py-1 overflow-x-auto rounded-md bottom-1 left-1 right-8 bg-black/30">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleThumbClick(idx)}
                  className={[
                    "relative w-10 h-10 rounded-sm overflow-hidden border",
                    activeIndex === idx
                      ? "border-white"
                      : "border-white/40 opacity-80 hover:opacity-100",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${product.name} ${idx + 1}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>

            {/* Right arrow to move through gallery */}
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute flex items-center justify-center text-xs text-white -translate-y-1/2 rounded-full right-1 top-1/2 w-7 h-7 bg-black/50 hover:bg-black/70"
            >
              ▶
            </button>
          </>
        )}
      </div>

      {/* TEXT / DETAILS */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-text-main line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[11px] text-text-muted line-clamp-2">
            {product.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-base font-bold text-brand-green">
          MK {displayPrice.toLocaleString()}
        </span>
        {product.vendor && (
          <div className="flex flex-col items-end gap-0">
            <span className="text-[11px] text-text-muted">
              by {product.vendor.name || product.vendor.email}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-brand-green">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              Verified vendor
            </span>
          </div>
        )}
      </div>

      {/* STOCK INFO */}
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span>
          Qty available:{" "}
          <span className="font-semibold">{product.stock ?? 0}</span>
        </span>
        {outOfStock && (
          <span className="text-[11px] font-semibold text-red-500">
            Out of stock
          </span>
        )}
      </div>

      {/* ADD TO CART BUTTON */}
      <button
        className="w-full px-3 py-2 mt-2 text-xs font-medium text-white transition-colors rounded-md bg-brand-green hover:bg-brand-greenLight disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={() => setShowForm(true)}
        disabled={outOfStock}
      >
        {outOfStock ? "Not available" : "Add to cart"}
      </button>

      {showForm && !outOfStock && (
        <AddToCartDialog product={product} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

/* ---------- Add to cart dialog (with quantity) ---------- */

interface AddToCartDialogProps {
  product: Product;
  onClose: () => void;
}

function AddToCartDialog({ product, onClose }: AddToCartDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
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

    const sure = window.confirm(
      `You are requesting ${quantity} x "${product.name}". ${vendorLabel} will contact you to process the business. Continue?`
    );
    if (!sure) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/cart`, {
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
        throw new Error(body.message || "Failed to add to cart");
      }

      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to add to cart");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md p-4 space-y-3 border rounded-lg shadow-lg bg-bg-light border-gray-soft">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">
            Add &quot;{product.name}&quot; to cart
          </h4>
          <button
            className="text-xs text-text-muted hover:text-text-main"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] text-text-muted">
          By adding this item to the cart,{" "}
          <span className="font-semibold">{vendorLabel}</span> will receive an
          email with your request and will contact you to process payment and
          delivery.
        </p>

        <form className="space-y-2" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-[11px] font-medium">Your name *</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-gray-soft bg-bg-light"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium">
              Quantity (max {maxQty ?? "∞"})
            </label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-gray-soft bg-bg-light"
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
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
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium">Email (optional)</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-gray-soft bg-bg-light"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium">
              Note (optional e.g. preferred time to call)
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm border rounded-md border-gray-soft bg-bg-light"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-[11px] text-red-500">{error}</p>}
          {success && (
            <p className="text-[11px] text-brand-green">
              Request sent! {vendorLabel} will contact you soon.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1 text-xs rounded-md bg-gray-soft text-text-muted"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1 text-xs font-semibold text-white rounded-md bg-brand-green hover:bg-brand-greenLight disabled:opacity-60"
            >
              {saving ? "Submitting..." : "Confirm add to cart"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
