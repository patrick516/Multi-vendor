// src/app/features/products/LeafletMap.tsx
"use client";

import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import { Icon } from "leaflet";

// Define default marker icon
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

interface LatLng {
  lat: number;
  lng: number;
}

interface LeafletMapProps {
  center: LatLngExpression | null;
  userLocation?: LatLng | null;
}

// Dynamically import react-leaflet components only on client-side
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  height: "260px",
  borderRadius: "0.75rem",
};

export default function LeafletMap({ center, userLocation }: LeafletMapProps) {
  if (!center) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-xl border border-gray-soft bg-gray-soft text-[11px] text-text-muted">
        No map location provided for this product.
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={MAP_CONTAINER_STYLE}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Product marker */}
      <Marker position={center} icon={defaultIcon} />

      {/* User location marker */}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={defaultIcon}
        />
      )}
    </MapContainer>
  );
}
