// website/src/app/features/home/LiveSnapshotStats.tsx
"use client";

import { useMemo } from "react";
import type { Product } from "../products/types";

interface LiveSnapshotStatsProps {
  products?: Product[]; // ✅ now optional
  district?: string;
}

/**
 * Shows a quick summary snapshot of the current product list:
 * - total products
 * - products with location
 * - distinct districts
 * - price range (min / max)
 */
export default function LiveSnapshotStats({
  products = [], // ✅ default empty array
  district,
}: LiveSnapshotStatsProps) {
  const stats = useMemo(() => {
    const total = products.length;

    const withLocation = products.filter(
      (p) => typeof p.latitude === "number" && typeof p.longitude === "number"
    ).length;

    const districts = new Set<string>();
    const categories = new Set<string>();
    const prices: number[] = [];

    for (const p of products) {
      if (p.district) districts.add(p.district);
      if (p.category?.name) categories.add(p.category.name);
      if (typeof p.displayPrice === "number") {
        prices.push(p.displayPrice);
      }
    }

    prices.sort((a, b) => a - b);
    const minPrice = prices.length ? prices[0] : null;
    const maxPrice = prices.length ? prices[prices.length - 1] : null;

    return {
      total,
      withLocation,
      districtsCount: districts.size,
      categoriesCount: categories.size,
      minPrice,
      maxPrice,
    };
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="w-full px-4 py-3 text-xs border rounded-xl border-gray-soft bg-gray-soft text-text-muted">
        No products found for this view.
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-3 space-y-2 bg-white border shadow-sm rounded-xl border-gray-soft">
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span className="uppercase tracking-[0.16em] font-semibold">
          Live Snapshot
        </span>
        {district && (
          <span>
            District:{" "}
            <span className="font-semibold text-text-main">{district}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-[11px] md:text-xs">
        {/* Total products */}
        <StatCard label="Total products" value={stats.total.toLocaleString()} />

        {/* Products with coordinates */}
        <StatCard
          label="With map location"
          value={stats.withLocation.toLocaleString()}
          helper={
            stats.total > 0
              ? `${Math.round((stats.withLocation / stats.total) * 100)}%`
              : undefined
          }
        />

        {/* Districts */}
        <StatCard
          label="Districts covered"
          value={stats.districtsCount.toLocaleString()}
        />

        {/* Price range */}
        <StatCard
          label="Price range (MK)"
          value={
            stats.minPrice != null && stats.maxPrice != null
              ? `${stats.minPrice.toLocaleString()} – ${stats.maxPrice.toLocaleString()}`
              : "N/A"
          }
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
}

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-soft bg-gray-soft/40 px-3 py-2 flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-[0.12em] text-text-muted">
        {label}
      </span>
      <span className="text-sm font-semibold md:text-base text-text-main">
        {value}
      </span>
      {helper && <span className="text-[10px] text-text-muted">{helper}</span>}
    </div>
  );
}
