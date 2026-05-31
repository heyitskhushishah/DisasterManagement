"use client";

import { cn } from "@/lib/utils";
import type { FacilitiesData } from "@/lib/facilities/types";

const RADIUS_OPTIONS = [
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
  { label: "25 km", value: 25000 },
  { label: "50 km", value: 50000 },
];

const TYPE_LABELS: Record<string, string> = {
  hospital: "Hospitals",
  police: "Police Stations",
  fire_station: "Fire Stations",
  shelter: "Shelters",
};

const TYPE_COLORS: Record<string, string> = {
  hospital: "text-red-400 border-red-500/30 bg-red-500/10",
  police: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  fire_station: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  shelter: "text-green-400 border-green-500/30 bg-green-500/10",
};

type FacilitiesPanelProps = {
  data: FacilitiesData | null;
  loading: boolean;
  error: string | null;
  radius: number;
  onRadiusChange: (r: number) => void;
  hasLocation: boolean;
};

export function FacilitiesPanel({
  data,
  loading,
  error,
  radius,
  onRadiusChange,
  hasLocation,
}: FacilitiesPanelProps) {
  const grouped = data
    ? (["hospital", "police", "fire_station", "shelter"] as const).reduce(
        (acc, type) => {
          const items = data.facilities.filter((f) => f.type === type);
          if (items.length > 0) acc[type] = items;
          return acc;
        },
        {} as Record<string, typeof data.facilities>,
      )
    : {};

  const total = data?.facilities.length ?? 0;

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Search Radius
        </p>
        <div className="flex gap-1">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onRadiusChange(opt.value)}
              className={cn(
                "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                radius === opt.value
                  ? "border-teal-500/50 bg-teal-500/20 text-teal-300"
                  : "border-slate-700/60 bg-slate-800/40 text-slate-400 hover:border-slate-600/60",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!hasLocation && (
        <p className="text-sm text-slate-500">
          Click a location on the map to find nearby facilities.
        </p>
      )}

      {loading && (
        <p className="text-sm text-slate-500">Searching nearby facilities...</p>
      )}

      {error && !loading && (
        <p className="text-xs text-amber-400/80">{error}</p>
      )}

      {hasLocation && !loading && !error && total === 0 && (
        <p className="text-sm text-slate-500">
          No facilities found within this radius.
        </p>
      )}

      {total > 0 && (
        <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
          {Object.entries(grouped).map(([type, facilities]) => (
            <div key={type}>
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide",
                    TYPE_COLORS[type]?.split(" ")[0] ?? "text-slate-400",
                  )}
                >
                  {TYPE_LABELS[type] ?? type}
                </span>
                <span className="text-[10px] text-slate-500">
                  {facilities.length}
                </span>
              </div>
              <div className="space-y-1">
                {facilities.slice(0, 8).map((f) => (
                  <div
                    key={f.id}
                    className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-slate-200 truncate max-w-[140px]">
                        {f.name}
                      </p>
                      <span className="text-[10px] text-amber-400">
                        {f.distance} km
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span>ETA: ~{f.etaMinutes} min</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5",
                          f.availability === "Unknown"
                            ? "text-slate-500"
                            : "text-emerald-400",
                        )}
                      >
                        {f.availability}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
