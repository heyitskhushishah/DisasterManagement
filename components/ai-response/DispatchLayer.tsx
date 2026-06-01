"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

import { STATUS_COLORS, type DispatchMission } from "@/lib/dispatch/types";

type DispatchLayerProps = {
  missions: DispatchMission[];
  visible: boolean;
};

const ASSET_EMOJI: Record<string, string> = {
  ambulance: "🚑",
  rescue_team: "🦺",
  fire_truck: "🚒",
};

const STATUS_GLOW: Record<string, string> = {
  Assigned: "rgba(148,163,184,0.5)",
  "En Route": "rgba(245,158,11,0.6)",
  "On Scene": "rgba(59,130,246,0.6)",
  Completed: "rgba(22,163,74,0.4)",
};

function makeMarkerIcon(emoji: string, glow: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${glow};
      border:2px solid rgba(255,255,255,0.8);
      box-shadow:0 0 12px ${glow};
      display:flex;align-items:center;justify-content:center;
      font-size:16px;transition:all 0.3s;
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export function DispatchLayer({ missions, visible }: DispatchLayerProps) {
  if (!visible) return null;

  return (
    <>
      {missions.map((mission) =>
        mission.assets
          .filter((a) => a.status !== "Completed")
          .map((asset) => (
            <Marker
              key={asset.id}
              position={[asset.lat, asset.lng]}
              icon={makeMarkerIcon(
                ASSET_EMOJI[asset.type] ?? "📍",
                STATUS_GLOW[asset.status] ?? "rgba(255,255,255,0.3)",
              )}
            >
              <Popup>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-slate-800">{asset.label}</p>
                  <p className="text-slate-600">
                    Status: <span style={{ color: STATUS_COLORS[asset.status] }}>{asset.status}</span>
                  </p>
                  {asset.status === "En Route" && (
                    <p className="text-slate-600">ETA: {Math.round(asset.eta / 60)} min</p>
                  )}
                  <p className="text-slate-500 text-[10px]">{mission.incidentLabel}</p>
                </div>
              </Popup>
            </Marker>
          )),
      )}
    </>
  );
}
