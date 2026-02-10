// src/app/components/DistrictSelector.tsx
"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../utils/fetcher";

// Fallback list if backend fails
const FALLBACK_DISTRICTS = [
  "Balaka",
  "Blantyre",
  "Chikwawa",
  "Chiradzulu",
  "Chitipa",
  "Dedza",
  "Dowa",
  "Karonga",
  "Kasungu",
  "Likoma",
  "Lilongwe",
  "Machinga",
  "Mangochi",
  "Mchinji",
  "Mulanje",
  "Mwanza",
  "Mzimba",
  "Neno",
  "Nkhata Bay",
  "Nkhotakota",
  "Nsanje",
  "Ntcheu",
  "Ntchisi",
  "Phalombe",
  "Rumphi",
  "Salima",
  "Thyolo",
  "Zomba",
];

const STORAGE_KEY = "mv_selected_district";

export function getStoredDistrict() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export default function DistrictSelector() {
  const [district, setDistrict] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredDistrict();
    if (!stored) {
      setOpen(true);
    } else {
      setDistrict(stored);
    }
  }, []);

  useEffect(() => {
    async function loadDistricts() {
      try {
        setLoading(true);
        setMetaError(null);
        const res = await fetch(`${API_BASE_URL}/meta/districts`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Failed to load districts from backend");
        }
        const data = (await res.json()) as string[];
        setDistricts(data);
      } catch (err: any) {
        setMetaError(err.message || "Using default district list");
        setDistricts(FALLBACK_DISTRICTS);
      } finally {
        setLoading(false);
      }
    }
    loadDistricts();
  }, []);

  function handleSave() {
    if (!district) return;
    localStorage.setItem(STORAGE_KEY, district);
    setOpen(false);
    window.dispatchEvent(
      new CustomEvent("mv-district-changed", { detail: district })
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-bg-light border border-gray-soft shadow-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text-main">
          Where do you want to buy from?
        </h2>
        <p className="text-[11px] text-text-muted">
          Select the district where you want to find products. We’ll only show
          results from that area.
        </p>

        {metaError && <p className="text-[11px] text-red-500">{metaError}</p>}

        <select
          className="w-full rounded-md border border-gray-soft bg-bg-light px-3 py-2 text-sm"
          value={district || ""}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={loading}
        >
          <option value="">Select district</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <button
          onClick={handleSave}
          disabled={!district}
          className="w-full px-4 py-2 rounded-md bg-brand-green text-white text-sm font-semibold hover:bg-brand-greenLight disabled:opacity-60"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
