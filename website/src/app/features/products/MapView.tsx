"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { Product } from "./types";
import { fetchJson } from "@/app/utils/fetcher";

interface LatLng {
  lat: number;
  lng: number;
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
    sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
  const d = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));

  return R * d;
}

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  height: "260px",
  borderRadius: "0.75rem",
};

export default function MapView() {
  const searchParams = useSearchParams();

  const district = searchParams.get("district") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const search = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // Load products based on URL filters
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (district) params.set("district", district);
        if (categoryId) params.set("categoryId", categoryId);
        if (search.trim()) params.set("search", search.trim());

        let path = "/products";
        const query = params.toString();
        if (query) path += `?${query}`;

        const data = await fetchJson<Product[]>(path);
        setProducts(data);
      } catch (err: any) {
        setError(err.message || "Failed to load products for map");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [district, categoryId, search]);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // ignore errors
      }
    );
  }, []);

  // Products with coordinates
  const productsWithCoords = useMemo(() => {
    return products.filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number"
    );
  }, [products]);

  // Compute distance and decide which to show (<= 5km vs all)
  const NEARBY_RADIUS_KM = 5;

  const { nearby, others } = useMemo(() => {
    if (!userLocation) {
      return { nearby: [] as (Product & { distanceKm: number })[], others: productsWithCoords.map((p) => ({ ...p, distanceKm: NaN })) };
    }

    const withDistance = productsWithCoords.map((p) => {
      const distanceKm = haversineDistance(userLocation, {
        lat: p.latitude as number,
        lng: p.longitude as number,
      });
      return { ...p, distanceKm };
    });

    const close = withDistance.filter((p) => p.distanceKm <= NEARBY_RADIUS_KM);
    const far = withDistance.filter((p) => p.distanceKm > NEARBY_RADIUS_KM);

    return { nearby: close, others: far };
  }, [productsWithCoords, userLocation]);

  const markersToShow =
    userLocation && nearby.length > 0 ? nearby : productsWithCoords;

  const center: LatLngExpression = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng] as LatLngExpression;
    if (markersToShow.length > 0) {
      const first = markersToShow[0];
      return [first.latitude as number, first.longitude as number];
    }
    // Default center (Malawi)
    return [-13.2543, 34.3015];
  }, [userLocation, markersToShow]);

  if (loading) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-xl border border-gray-soft bg-gray-soft text-[11px] text-text-muted">
        Loading map…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 text-[11px] text-red-600">
        {error}
      </div>
    );
  }

  if (productsWithCoords.length === 0) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-xl border border-gray-soft bg-gray-soft text-[11px] text-text-muted">
        No products with map location yet.
      </div>
    );
  }

  const showingNearby = userLocation && nearby.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span>
          {showingNearby
            ? `Products within ${NEARBY_RADIUS_KM} km of you`
            : "Products with location on map"}
        </span>
        {district && (
          <span>
            District: <span className="font-semibold">{district}</span>
          </span>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={userLocation ? 12 : 10}
        style={MAP_CONTAINER_STYLE}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Product markers */}
        {markersToShow.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude as number, p.longitude as number]}
          >
            <Popup>
              <div className="space-y-1 text-[11px]">
                <p className="font-semibold">{p.name}</p>
                {p.district && (
                  <p className="text-text-muted">
                    {p.district}
                    {p.area ? `, ${p.area}` : ""}
                  </p>
                )}
                <p className="font-semibold text-emerald-700">
                  MK{" "}
                  {(
                    p.displayPrice ??
                    p.price ??
                    p.basePrice ??
                    0
                  ).toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {userLocation && nearby.length === 0 && (
        <p className="text-[11px] text-text-muted">
          No products within {NEARBY_RADIUS_KM} km of you. Showing all products
          with map location.
        </p>
      )}
    </div>
  );
}
