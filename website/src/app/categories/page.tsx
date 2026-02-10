"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/app/utils/fetcher";

interface Category {
  id: number;
  name: string;
  slug: string;
}
const CATEGORY_ICON_MAP: Record<string, string[]> = {
  "electronics-media": ["cellphone-svgrepo-com.svg"],
  "mobile-phones": ["broadcast-device-electronics-svgrepo-com.svg"],
  "computers-laptops": [
    "computer-and-monitor-hand-drawn-tools-svgrepo-com.svg",
  ],
  "cameras-photography": ["photograph-frame-svgrepo-com.svg"],
  "home-living": ["chairs-dinner-svgrepo-com.svg"],
  furniture: ["furniture-home-furniture-design-interior-svgrepo-com.svg"],
  "grocery-supermarket": ["groceries-svgrepo-com.svg"],
  "fashion-style": ["dress-of-vintage-black-design-style-svgrepo-com.svg"],
  "sports-fitness": ["running-svgrepo-com.svg"],
  "health-wellness": ["stethoscope-svgrepo-com.svg"],
  "cars-motorbikes-machinery": ["caterpillar-machine-svgrepo-com.svg"],
  "service-spares-accessories": ["tow-truck-svgrepo-com.svg"],
  "real-estate-property": ["home-1-svgrepo-com.svg"],
  "office-equipment-stationery": ["desk-computer-svgrepo-com.svg"],
  "farming-agriculture": ["vegetables-salad-svgrepo-com.svg"],
  "vacancies-jobs-recruitment": ["jobs.svg"],
  "food-beverages": ["drink-soft-drink-svgrepo-com.svg"],
  "construction-engineering": [
    "construction-worker-worker-work-construction-svgrepo-com.svg",
    "cranes-worker-svgrepo-com.svg",
  ],
  "courier-freight": ["delivery-svgrepo-com.svg"],
  "education-training": ["education-training.svg"],
  "art-craft-culture": [
    "paint-palette-art-svgrepo-com.svg",
    "theater-masks-svgrepo-com.svg",
  ],
  "events-entertainment": ["ballon-birthday-carnival-svgrepo-com.svg"],
  "transport-travel": ["car-transport-svgrepo-com.svg"],
  "tourism-accommodation": ["summer-svgrepo-com.svg"],
  "finance-insurance-brokers": ["bank-payment-svgrepo-com.svg"],
  "household-goods": ["laundry-basket-svgrepo-com.svg"],
  "technical-skills": ["service-parts-accessories.svg"],
  "industries-factories": [
    "smog-factory-building-contamination-svgrepo-com.svg",
  ],
  "clubs-societies": ["group-of-workers-svgrepo-com.svg"],
  religion: ["church-line-svgrepo-com.svg"],
  "legal-practitioners": ["legal-hammer-svgrepo-com.svg"],

  other: ["shop-cart-svgrepo-com.svg", "shopping-more.svg"],
};

function getIconsForCategory(cat: Category): string[] {
  const icons = CATEGORY_ICON_MAP[cat.slug];
  if (icons && icons.length > 0) return icons;

  // fallback icon if slug not mapped
  return ["shop-cart-svgrepo-com.svg"];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const cats = await fetchJson<Category[]>("/categories");
        setCategories(cats);
      } catch (err: any) {
        setError(err.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="pb-10 space-y-4">
      <h1 className="text-2xl font-bold text-text-main">Browse by category</h1>
      <p className="text-lg text-text-muted">
        Tap a category to see products in that sector. Icons help users quickly
        understand what each category represents – even if they can&apos;t read
        the text.
      </p>

      {loading && (
        <p className="text-md text-text-muted">Loading categories…</p>
      )}
      {error && <p className="text-red-500 text-md">{error}</p>}

      {!loading && !error && categories.length === 0 && (
        <p className="text-md text-text-muted">
          No categories found. Please check back later.
        </p>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const icons = getIconsForCategory(cat);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("categoryId", String(cat.id));
                  window.location.href = `/products?${params.toString()}`;
                }}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
              >
                {/* Icons container */}
                <div className="flex items-center justify-center w-20 h-16 overflow-hidden rounded-xl bg-emerald-50">
                  <div className="flex items-center justify-center gap-1">
                    {icons.slice(0, 2).map((iconName, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${cat.slug}-${iconName}-${idx}`}
                        src={`/icons/${iconName}`}
                        alt={cat.name}
                        className="object-contain w-10 h-10"
                      />
                    ))}
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-semibold text-text-main">
                    {cat.name}
                  </p>
                  <p className="text-lg text-text-muted">
                    Tap to browse products in this category.
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
