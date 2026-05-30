import type { GdacsAlertLevel } from "@/lib/map/gdacs";

type AlertStatusBarProps = {
  highestAlert: GdacsAlertLevel | null;
  liveEventCount: number;
  highAlertCount: number;
  lastRefreshed: string;
};

const formatRefreshed = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const STATUS_CONFIG: Record<
  GdacsAlertLevel | "clear",
  { label: string; tone: string; dot: string }
> = {
  Red: {
    label: "Critical alert — immediate coordination advised",
    tone: "border-red-500/40 bg-red-950/50 text-red-100",
    dot: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]",
  },
  Orange: {
    label: "Elevated alert — review active events and assignments",
    tone: "border-amber-500/40 bg-amber-950/40 text-amber-100",
    dot: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]",
  },
  Green: {
    label: "Advisory level events reported — stay situationally aware",
    tone: "border-emerald-500/30 bg-emerald-950/30 text-emerald-100",
    dot: "bg-emerald-400",
  },
  clear: {
    label: "No high-severity GDACS alerts in region — routine monitoring",
    tone: "border-slate-700/80 bg-slate-900/60 text-slate-300",
    dot: "bg-teal-400",
  },
};

export const AlertStatusBar = ({
  highestAlert,
  liveEventCount,
  highAlertCount,
  lastRefreshed,
}: AlertStatusBarProps) => {
  const key = highestAlert ?? "clear";
  const config = STATUS_CONFIG[key];

  return (
    <div
      className={`mt-6 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${config.tone}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${config.dot}`}
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium">{config.label}</p>
          <p className="mt-0.5 text-xs opacity-80">
            {liveEventCount} live event{liveEventCount === 1 ? "" : "s"} tracked
            {highAlertCount > 0
              ? ` · ${highAlertCount} high-priority (red/orange)`
              : ""}
          </p>
        </div>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-wider opacity-70 sm:text-right">
        Updated {formatRefreshed(lastRefreshed)} IST
      </p>
    </div>
  );
};
