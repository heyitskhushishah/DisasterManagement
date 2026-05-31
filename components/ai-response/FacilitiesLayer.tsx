"use client";

import L from "leaflet";
import { useEffect } from "react";
import { Circle, Marker, Popup, useMap } from "react-leaflet";

import type { Facility, FacilitiesData } from "@/lib/facilities/types";

const FACILITY_ICONS: Record<string, string> = {
  hospital: "🏥",
  police: "👮",
  fire_station: "🚒",
  shelter: "🏠",
};

const FACILITY_COLORS: Record<string, string> = {
  hospital: "#dc2626",
  police: "#2563eb",
  fire_station: "#ea580c",
  shelter: "#16a34a",
};

function facilityIcon(type: string) {
  const color = FACILITY_COLORS[type] ?? "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px ${color}80;display:flex;align-items:center;justify-content:center;font-size:14px;">${FACILITY_ICONS[type] ?? "📍"}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FacilityMarkers({ facilities }: { facilities: Facility[] }) {
  const map = useMap();

  useEffect(() => {
    if (facilities.length === 0) return;
    const bounds = L.latLngBounds(
      facilities.map((f) => [f.lat, f.lng] as [number, number]),
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [facilities, map]);

  return (
    <>
      {facilities.map((f) => (
        <Marker key={f.id} position={[f.lat, f.lng]} icon={facilityIcon(f.type)}>
          <Popup>
            <div className="min-w-[180px] text-sm">
              <div className="flex items-center gap-2">
                <span>{FACILITY_ICONS[f.type]}</span>
                <strong className="text-sm">{f.name}</strong>
              </div>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <p>📍 {f.distance} km away</p>
                <p>⏱ ~{f.etaMinutes} min ETA</p>
                {f.capacity != null && <p>🛏 Capacity: {f.capacity}</p>}
                <p>📊 Availability: {f.availability}</p>
                {f.phone && <p>📞 {f.phone}</p>}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

type FacilitiesLayerProps = {
  data: FacilitiesData | null;
  visible: boolean;
};

export function FacilitiesLayer({ data, visible }: FacilitiesLayerProps) {
  if (!visible || !data) return null;

  return (
    <>
      <Circle
        center={[data.center.lat, data.center.lng]}
        radius={data.radius}
        pathOptions={{
          color: "#f59e0b",
          weight: 2,
          fillColor: "#f59e0b",
          fillOpacity: 0.08,
          dashArray: "6 4",
        }}
      />
      <FacilityMarkers facilities={data.facilities} />
    </>
  );
}
