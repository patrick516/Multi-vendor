// website/src/app/features/products/MapView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { Icon } from "leaflet";
import type { Product } from "./types";
import { fetchJson } from "@/app/utils/fetcher";
import { getStoredDistrict } from "@/app/components/DistrictSelector";

const DEFAULT_CENTER: [number, number] = [-13.9626, 33.7741];
const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  height: "320px",
  borderRadius: "0.75rem",
};

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

const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const userIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
  className: "leaflet-marker-user",
});

export default function MapView() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  const [district, setDistrict] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // Load user's district
  useEffect(() => {
    setDistrict(getStoredDistrict());
  }, []);

  // Listen to district changes from DistrictSelector
  useEffect(() => {
    function onDistrictChange(e: any) {
      const newDistrict = e.detail as string;
      setDistrict(newDistrict);
    }
    window.addEventListener("mv-district-changed", onDistrictChange);
    return () =>
      window.removeEventListener("mv-district-changed", onDistrictChange);
  }, []);

  // Load products for map (district + search)
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (district) params.set("district", district);
        if (q) params.set("search", q);

        let path = "/products";
        const query = params.toString();
        if (query) path += `?${query}`;

        const data = await fetchJson<Product[]>(path);
        const withCoords = data.filter(
          (p) =>
            typeof p.latitude === "number" && typeof p.longitude === "number"
        );
        setProducts(withCoords);
      } catch (err: any) {
        setError(err.message || "Failed to load products for map");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [district, q]);

  // Ask browser for user's current location
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
        // ignore if user denies
      }
    );
  }, []);

  const center: LatLngExpression = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (
      products.length > 0 &&
      typeof products[0].latitude === "number" &&
      typeof products[0].longitude === "number"
    ) {
      return [products[0].latitude as number, products[0].longitude as number];
    }
    return DEFAULT_CENTER;
  }, [userLocation, products]);

  if (loading) {
    return (
      <div className="w-full h-[320px] rounded-xl border border-gray-soft bg-gray-soft animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading map...
      </div>
    );
  }

  if (error) {
    return <p className="text-[11px] text-red-500">{error}</p>;
  }

  if (products.length === 0) {
    return (
      <div className="w-full h-[200px] rounded-xl border border-gray-soft bg-gray-soft flex items-center justify-center text-xs text-text-muted">
        No products with map location yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span>Products with location on map</span>
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
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Product markers */}
        {products.map((product) => {
          if (
            typeof product.latitude !== "number" ||
            typeof product.longitude !== "number"
          ) {
            return null;
          }

          const lat = product.latitude!;
          const lng = product.longitude!;
          const pos: LatLng = { lat, lng };

          let distanceText = "Distance unknown";
          if (userLocation) {
            const km = haversineDistance(userLocation, pos);
            distanceText = `${km.toFixed(1)} km from you`;
          }

          return (
            <Marker
              key={product.id}
              position={[lat, lng]}
              icon={defaultIcon}
              eventHandlers={{
                click: () => setSelectedProductId(product.id),
              }}
            >
              {selectedProductId === product.id && (
                <Popup>
                  <div className="space-y-1 text-[11px]">
                    <p className="font-semibold text-text-main">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="text-text-muted">
                        Category: {product.category.name}
                      </p>
                    )}
                    {product.district && (
                      <p className="text-text-muted">
                        Location: {product.district}
                        {product.area ? `, ${product.area}` : ""}
                      </p>
                    )}
                    <p className="text-text-muted">{distanceText}</p>
                    {product.displayPrice && (
                      <p className="font-semibold text-brand-green">
                        MK {product.displayPrice.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
