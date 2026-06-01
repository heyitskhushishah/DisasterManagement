"use client";

import { cn } from "@/lib/utils";
import type { Recommendation, RecommendationCategory, RecommendationSeverity } from "@/lib/recommendations/types";
import { SEVERITY_COLORS } from "@/lib/recommendations/types";

const CATEGORY_META: Record<RecommendationCategory, { label: string; icon: string }> = {
  weather: { label: "Weather", icon: "🌤" },
  medical: { label: "Medical", icon: "🏥" },
  evacuation: { label: "Evacuation", icon: "🚸" },
  logistics: { label: "Logistics", icon: "🚛" },
  infrastructure: { label: "Infrastructure", icon: "🏗" },
};

const BORDER_GLOW: Record<RecommendationSeverity, string> = {
  Critical: "border-l-red-500 shadow-[inset_0_0_12px_rgba(220,38,38,0.12)]",
  High: "border-l-orange-500 shadow-[inset_0_0_12px_rgba(249,115,22,0.10)]",
  Moderate: "border-l-amber-500 shadow-[inset_0_0_12px_rgba(245,158,11,0.08)]",
  Low: "border-l-emerald-500 shadow-[inset_0_0_12px_rgba(22,163,74,0.06)]",
};

type RecommendationPanelProps = {
  recommendations: Recommendation[];
  loading?: boolean;
};

export function RecommendationPanel({ recommendations, loading }: RecommendationPanelProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-slate-800/60 bg-slate-800/30"
          />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <p className="text-center text-xs text-slate-500">
        No recommendations yet. Activate the dispatch or wait for weather and risk data.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
      {recommendations.map((rec) => {
        const meta = CATEGORY_META[rec.category];
        const color = SEVERITY_COLORS[rec.severity];
        return (
          <div
            key={rec.id}
            className={cn(
              "rounded-lg border border-slate-800/60 border-l-4 bg-slate-900/50 px-3 py-2.5 transition-colors hover:bg-slate-900/80",
              BORDER_GLOW[rec.severity],
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{meta.icon}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {meta.label}
                </span>
              </div>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color,
                  backgroundColor: `${color}18`,
                  border: `1px solid ${color}40`,
                }}
              >
                {rec.severity}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {rec.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
