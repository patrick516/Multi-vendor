// website/src/app/features/products/LiveMap.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { Icon } from "leaflet";
import type { Product } from "./types";

const DEFAULT_CENTER: [number, number] = [-13.9626, 33.7741]; // Malawi-ish

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  height: "320px",
  borderRadius: "0.75rem",
};

// Haversine distance in km
type LatLng = { lat: number; lng: number };

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

interface LiveMapProps {
  products: Product[];
  district?: string;
}

// Default marker icons (Leaflet’s default)
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

export default function LiveMap({ products, district }: LiveMapProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // Only use products that have coordinates
  const productsWithCoords = useMemo(
    () =>
      products.filter(
        (p) => typeof p.latitude === "number" && typeof p.longitude === "number"
      ),
    [products]
  );

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
      productsWithCoords.length > 0 &&
      typeof productsWithCoords[0].latitude === "number" &&
      typeof productsWithCoords[0].longitude === "number"
    ) {
      return [
        productsWithCoords[0].latitude as number,
        productsWithCoords[0].longitude as number,
      ];
    }
    return DEFAULT_CENTER;
  }, [userLocation, productsWithCoords]);

  if (productsWithCoords.length === 0) {
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
        {productsWithCoords.map((product) => {
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
