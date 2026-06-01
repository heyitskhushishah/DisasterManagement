"use client";

import { useEffect, useRef, useState } from "react";

import {
  createMission,
  tickMission,
} from "@/lib/dispatch/simulation";
import { STATUS_COLORS, type DispatchMission } from "@/lib/dispatch/types";
import { cn } from "@/lib/utils";

type DispatchPanelProps = {
  incidentLat?: number | null;
  incidentLng?: number | null;
  incidentLabel?: string;
  onMissionsChange?: (missions: DispatchMission[]) => void;
};

export function DispatchPanel({
  incidentLat,
  incidentLng,
  incidentLabel,
  onMissionsChange,
}: DispatchPanelProps) {
  const [missions, setMissions] = useState<DispatchMission[]>([]);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    onMissionsChange?.(missions);
  }, [missions, onMissionsChange]);

  useEffect(() => {
    if (running && missions.length > 0) {
      intervalRef.current = setInterval(() => {
        setMissions((prev) =>
          prev
            .map((m) => tickMission(m))
            .filter((m) => !(m.status === "Completed" && Date.now() - m.createdAt > 120000)),
        );
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const handleStart = () => {
    if (incidentLat == null || incidentLng == null) return;
    const mission = createMission(incidentLat, incidentLng, incidentLabel ?? "Incident");
    setMissions((prev) => [...prev, mission]);
    setRunning(true);
  };

  const handleClear = () => {
    setMissions([]);
    setRunning(false);
  };

  const allAssets = missions.flatMap((m) =>
    m.assets.map((a) => ({ ...a, missionLabel: m.incidentLabel })),
  );
  const activeAssets = allAssets.filter((a) => a.status !== "Completed");
  const hasAny = missions.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={handleStart}
          disabled={incidentLat == null || incidentLng == null}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all",
            incidentLat != null
              ? "bg-teal-600 text-white hover:bg-teal-500"
              : "cursor-not-allowed bg-slate-800 text-slate-600",
          )}
        >
          Dispatch
        </button>
        <button
          onClick={handleClear}
          disabled={!hasAny}
          className="rounded-lg border border-slate-700/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {!hasAny && incidentLat == null && (
        <p className="text-center text-xs text-slate-500">
          Click a location on the map then Dispatch.
        </p>
      )}

      {hasAny && activeAssets.length === 0 && (
        <p className="text-center text-xs text-slate-500">All missions completed.</p>
      )}

      {hasAny && (
        <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
          {missions.map((mission) => {
            const active = mission.assets.filter((a) => a.status !== "Completed");
            if (active.length === 0 && mission.assets.every((a) => a.status === "Completed")) {
              return (
                <div
                  key={mission.id}
                  className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-400 truncate max-w-[160px]">
                      {mission.incidentLabel}
                    </p>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                      style={{
                        color: STATUS_COLORS.Completed,
                        backgroundColor: `${STATUS_COLORS.Completed}18`,
                      }}
                    >
                      Completed
                    </span>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={mission.id}
                className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-200 truncate max-w-[160px]">
                    {mission.incidentLabel}
                  </p>
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                    style={{
                      color: STATUS_COLORS[mission.status],
                      backgroundColor: `${STATUS_COLORS[mission.status]}18`,
                    }}
                  >
                    {mission.status}
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {active.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-2 text-[11px]">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[asset.status] }}
                      />
                      <span className="text-slate-400 w-24 truncate">{asset.label}</span>
                      <span className="text-slate-500 w-16 text-[10px]">
                        {asset.status === "En Route"
                          ? `ETA ${Math.round(asset.eta / 60)}m`
                          : asset.status === "Assigned"
                            ? "Standby"
                            : asset.status === "On Scene"
                              ? "On site"
                              : "Done"}
                      </span>
                      <div className="ml-auto w-14 bg-slate-800 rounded-full h-1.5">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round(asset.progress * 100)}%`,
                            backgroundColor: STATUS_COLORS[asset.status],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
