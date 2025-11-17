// website/src/app/features/products/ProductCard.tsx
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

  const [showForm, setShowForm] = useState(false);

  const outOfStock = (product.stock ?? 0) <= 0;

  return (
    <div className="relative border border-gray-soft bg-bg-light rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      {product.imageUrl && (
        <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

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

      <div className="mt-1 flex items-center justify-between">
        <span className="text-base font-bold text-brand-green">
          MK {displayPrice.toLocaleString()}
        </span>
        {product.vendor && (
          <span className="text-[11px] text-text-muted">
            by {product.vendor.name || product.vendor.email}
          </span>
        )}
      </div>

      {/* Quantity row */}
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

      <button
        className="mt-2 w-full text-xs font-medium px-3 py-2 rounded-md bg-brand-green text-white hover:bg-brand-greenLight transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

interface AddToCartDialogProps {
  product: Product;
  onClose: () => void;
}

function AddToCartDialog({ product, onClose }: AddToCartDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName) {
      setError("Please enter your name.");
      return;
    }

    const sure = window.confirm(
      "By adding this item to cart, the admin will contact you to process the business. Continue?"
    );
    if (!sure) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
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
      <div className="w-full max-w-md rounded-lg bg-bg-light border border-gray-soft shadow-lg p-4 space-y-3">
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
          By adding this item to the cart, an admin (or vendor) will contact you
          to process the business offline (phone, mobile money, bank, etc.).
        </p>

        <form className="space-y-2" onSubmit={handleSubmit}>
          {/* fields unchanged */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium">Your name *</label>
            <input
              className="w-full rounded-md border border-gray-soft bg-bg-light px-3 py-2 text-sm"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium">
              Phone (for call / WhatsApp)
            </label>
            <input
              className="w-full rounded-md border border-gray-soft bg-bg-light px-3 py-2 text-sm"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium">Email (optional)</label>
            <input
              className="w-full rounded-md border border-gray-soft bg-bg-light px-3 py-2 text-sm"
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
              className="w-full rounded-md border border-gray-soft bg-bg-light px-3 py-2 text-sm"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-[11px] text-red-500">{error}</p>}
          {success && (
            <p className="text-[11px] text-brand-green">
              Added! Admin will contact you soon.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1 rounded-md bg-gray-soft text-text-muted text-xs"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1 rounded-md bg-brand-green text-white text-xs font-semibold hover:bg-brand-greenLight disabled:opacity-60"
            >
              {saving ? "Submitting..." : "Confirm add to cart"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
