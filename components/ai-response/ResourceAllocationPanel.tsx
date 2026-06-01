"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { calculateResources, type ResourceInputs, type ResourceAllocation } from "@/lib/resources/calculator";

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/40" },
  HIGH: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/40" },
  MEDIUM: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/40" },
  LOW: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/40" },
};

type ResourceCard = {
  label: string;
  value: number;
  icon: string;
  color: string;
};

type ResourceAllocationPanelProps = {
  inputs: ResourceInputs;
};

function AnimatedCard({ card, index }: { card: ResourceCard; index: number }) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 transition-all duration-500 hover:border-slate-700/60",
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{card.icon}</span>
          <span className="text-xs font-medium text-slate-400">{card.label}</span>
        </div>
        <span
          className={cn(
            "tabular-nums text-lg font-bold transition-all duration-700",
            card.color,
          )}
        >
          {card.value}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", card.color.replace("text-", "bg-"))}
          style={{
            width: `${Math.min((card.value / 60) * 100, 100)}%`,
            animationDelay: `${index * 150 + 300}ms`,
          }}
        />
      </div>
    </div>
  );
}

function PriorityBadge({ priority, score }: { priority: string; score: number }) {
  const s = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.LOW;
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 transition-all",
        s.bg,
        s.border,
      )}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Response Priority
        </p>
        <p className={cn("mt-0.5 text-lg font-bold", s.text)}>{priority}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-800">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", s.text.replace("text-", "bg-"))}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={cn("text-xs font-semibold", s.text)}>{score}</span>
      </div>
    </div>
  );
}

export function ResourceAllocationPanel({ inputs }: ResourceAllocationPanelProps) {
  const allocation = useMemo(() => calculateResources(inputs), [inputs]);

  const cards: ResourceCard[] = [
    { label: "Ambulances Needed", value: allocation.ambulances, icon: "🚑", color: "text-red-400" },
    { label: "Rescue Teams Needed", value: allocation.rescueTeams, icon: "🚁", color: "text-orange-400" },
    { label: "Shelters Needed", value: allocation.shelters, icon: "🏠", color: "text-emerald-400" },
    { label: "Medical Teams Needed", value: allocation.medicalTeams, icon: "🏥", color: "text-blue-400" },
  ];

  return (
    <div className="space-y-3">
      <PriorityBadge priority={allocation.priority} score={allocation.priorityScore} />

      <div className="space-y-2">
        {cards.map((card, i) => (
          <AnimatedCard key={card.label} card={card} index={i} />
        ))}
      </div>
    </div>
  );
}
