"use client";

import L from "leaflet";
import { useEffect } from "react";
import { Polyline, Popup, Marker, useMap } from "react-leaflet";

import { ROUTE_COLORS, ROUTE_LABELS, type RouteData } from "@/lib/routing/types";

function RouteStartIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#dc2626;border:2px solid white;box-shadow:0 0 8px #dc262680;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function RouteEndIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px ${color}80;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

type RouteLayerProps = {
  data: RouteData | null;
  visible: boolean;
};

function RouteBoundsFitter({ data }: { data: RouteData }) {
  const map = useMap();

  useEffect(() => {
    const allCoords = [
      [data.from.lat, data.from.lng],
      [data.to.lat, data.to.lng],
      ...data.routes.flatMap((r) => r.coordinates),
    ] as [number, number][];
    const bounds = L.latLngBounds(allCoords);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [data, map]);

  return null;
}

export function RouteLayer({ data, visible }: RouteLayerProps) {
  if (!visible || !data) return null;

  return (
    <>
      <RouteBoundsFitter data={data} />

      <Marker position={[data.from.lat, data.from.lng]} icon={RouteStartIcon()}>
        <Popup>
          <div className="text-xs">
            <strong>Incident Location</strong>
          </div>
        </Popup>
      </Marker>

      <Marker position={[data.to.lat, data.to.lng]} icon={RouteEndIcon("#16a34a")}>
        <Popup>
          <div className="text-xs">
            <strong>Destination</strong>
          </div>
        </Popup>
      </Marker>

      {data.routes.map((leg, i) => {
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
        const label = ROUTE_LABELS[i % ROUTE_LABELS.length];
        const isFirst = i === 0;
        return (
          <Polyline
            key={i}
            positions={leg.coordinates.map((p) => [p.lat, p.lng])}
            pathOptions={{
              color,
              weight: isFirst ? 4 : 3,
              opacity: isFirst ? 0.85 : 0.6,
              dashArray: isFirst ? undefined : "8 6",
            }}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="font-semibold" style={{ color }}>{label}</p>
                <p>{(leg.distance / 1000).toFixed(1)} km</p>
                <p>{Math.round(leg.time / 60)} min ETA</p>
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
}
