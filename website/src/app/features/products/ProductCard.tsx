"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "./types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const images = [
    product.mainImageUrl || product.imageUrl,
    ...(product.galleryImageUrls || []),
  ].filter(Boolean) as string[];

  // active image (big/main one)
  const [activeImage, setActiveImage] = useState<string>(
    images[0] || "/file.svg"
  );

  const displayPrice =
    product.displayPrice ?? product.price ?? product.basePrice ?? 0;

  const categoryLabel = product.category?.name || "General";
  const districtLabel = product.district || "Malawi";
  const outOfStock = (product.stock ?? 0) <= 0;

  function handleOpenDetail() {
    router.push(`/products/${product.id}`);
  }

  return (
    <div
      onClick={handleOpenDetail}
      className="flex flex-col rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition hover:-translate-y-[2px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 cursor-pointer"
    >
      {/* Image + gallery strip */}
      <div className="w-full overflow-hidden rounded-t-2xl bg-slate-50">
        {/* Main image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={product.name}
          className="object-cover w-full h-36"
        />

        {/* Thumbnails: appear when hovering the main image area */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1 px-2 py-1 transition-opacity duration-200 opacity-0 bg-white/80 hover:opacity-100">
            {images.slice(0, 4).map((src, idx) => (
              <div
                key={idx}
                role="button"
                onClick={(e) => e.stopPropagation()} // don't trigger outer click
                onMouseEnter={() => setActiveImage(src)}
                className={`h-9 w-9 rounded border overflow-hidden ${
                  src === activeImage
                    ? "border-emerald-500"
                    : "border-slate-200"
                } bg-slate-50 cursor-pointer`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-1 px-3 pt-2 pb-3">
        {/* Name */}
        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
          {product.name}
        </p>

        {/* Price */}
        <p className="text-xs font-medium text-slate-700">
          MK{" "}
          <span className="text-sm font-semibold">
            {displayPrice.toLocaleString()}
          </span>
        </p>

        {/* Badge: stock or status */}
        <div className="flex flex-wrap items-center gap-1 mt-1">
          <span
            className={[
              "inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-medium",
              outOfStock
                ? "bg-slate-100 text-slate-500"
                : "bg-emerald-50 text-emerald-700",
            ].join(" ")}
          >
            {outOfStock ? "Out of stock" : "In stock"}
          </span>
          {product.vendor?.name && (
            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-[2px] text-[10px] font-medium text-slate-600">
              {product.vendor.name}
            </span>
          )}
        </div>

        {/* Bottom row: category + district */}
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-[2px] font-medium text-emerald-700">
            {categoryLabel}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-[2px] font-medium text-slate-600">
            {districtLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
