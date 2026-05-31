"use client";

import { useDisasterStore } from "@/lib/store/disasterStore";
import { cn } from "@/lib/utils";

const DISASTER_TYPES = ["Flood", "Fire", "Earthquake", "Cyclone", "Landslide"] as const;

const SEVERITY_LABELS = [
  "Minimal", "Low", "Moderate", "Elevated", "Substantial",
  "Severe", "Critical", "Extreme", "Catastrophic", "Apocalyptic",
];

const SEVERITY_COLORS = [
  "bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-amber-500", "bg-orange-500",
  "bg-orange-600", "bg-red-500", "bg-red-600", "bg-red-700", "bg-red-900",
];

export function DisasterSituationAnalysis() {
  const { situation, setDisasterType, setSeverity, setPopulationAffected, setDescription, reset } =
    useDisasterStore();

  return (
    <div className="dashboard-panel rounded-xl border border-slate-800/60">
      <div className="flex items-center justify-between border-b border-slate-800/60 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Disaster Situation Analysis
        </h3>
        {situation.disasterType && (
          <button
            type="button"
            onClick={reset}
            className="text-[11px] text-slate-500 underline transition hover:text-slate-300"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
            Disaster Type
          </label>
          <select
            value={situation.disasterType}
            onChange={(e) => setDisasterType(e.target.value as typeof situation.disasterType)}
            className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
          >
            <option value="">Select type...</option>
            {DISASTER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Severity
            </label>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                SEVERITY_COLORS[situation.severity - 1]?.replace("bg-", "text-") ?? "text-slate-400",
              )}
            >
              {situation.severity}/10 — {SEVERITY_LABELS[situation.severity - 1]}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={situation.severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full accent-teal-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-600">
            <span>1</span><span>10</span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
            Population Affected
          </label>
          <input
            type="number"
            min={0}
            value={situation.populationAffected}
            onChange={(e) => setPopulationAffected(Math.max(0, Number(e.target.value)))}
            placeholder="0"
            className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
            Description
          </label>
          <textarea
            rows={3}
            value={situation.description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the situation..."
            className="w-full resize-none rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Latitude
            </label>
            <input
              readOnly
              value={situation.latitude ?? ""}
              placeholder="Click map"
              className="w-full rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2 text-sm text-slate-400 outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Longitude
            </label>
            <input
              readOnly
              value={situation.longitude ?? ""}
              placeholder="Click map"
              className="w-full rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2 text-sm text-slate-400 outline-none"
            />
          </div>
        </div>

        {situation.latitude && situation.longitude && (
          <p className="text-[10px] text-teal-500/70">
            Marker placed at {situation.latitude.toFixed(4)}, {situation.longitude.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
