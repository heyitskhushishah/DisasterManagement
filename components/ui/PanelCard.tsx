import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PanelCard({
  title,
  children,
  className,
  action,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("dashboard-panel rounded-xl border border-slate-800/60", className)}>
      <div className="flex items-center justify-between border-b border-slate-800/60 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        {action && <div className="flex items-center gap-1">{action}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="dashboard-panel rounded-xl border border-slate-800/60 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-bold tracking-tight ${accent}`}>
        {value}
      </p>
    </div>
  );
}

export function StatusBadge({
  label,
  color,
  className,
}: {
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        className,
      )}
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}
