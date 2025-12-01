// website/src/app/features/products/LeafletMap.tsx
"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { Icon } from "leaflet"; // 👈 import Icon

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  height: "260px",
  borderRadius: "0.75rem",
};

interface LatLng {
  lat: number;
  lng: number;
}

// Use the same marker icon as LiveMap
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

interface LeafletMapProps {
  center: LatLngExpression | null;
  userLocation?: LatLng | null;
}

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

      {/* User location marker (if available) */}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={defaultIcon}
        />
      )}
    </MapContainer>
  );
}
