import type { DashboardStats } from "@/lib/dashboard/types";

type StatCardsProps = Pick<
  DashboardStats,
  | "liveEventCount"
  | "eonetCount"
  | "gdacsLiveCount"
  | "historicalCount"
  | "highAlertCount"
  | "redAlertCount"
>;

type StatCardProps = {
  label: string;
  value: number;
  hint: string;
  accent?: "default" | "critical" | "warning" | "neutral";
};

const ACCENT_STYLES = {
  default: "text-teal-300",
  critical: "text-red-400",
  warning: "text-amber-300",
  neutral: "text-slate-300",
} as const;

const StatCard = ({ label, value, hint, accent = "default" }: StatCardProps) => (
  <article className="dashboard-stat-card rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
      {label}
    </p>
    <p
      className={`mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight ${ACCENT_STYLES[accent]}`}
    >
      {value}
    </p>
    <p className="mt-1 text-xs text-slate-500">{hint}</p>
  </article>
);

export const StatCards = ({
  liveEventCount,
  eonetCount,
  gdacsLiveCount,
  historicalCount,
  highAlertCount,
  redAlertCount,
}: StatCardsProps) => {
  return (
    <section
      className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      aria-label="Situation overview metrics"
    >
      <StatCard
        label="Live events"
        value={liveEventCount}
        hint="NASA EONET + GDACS combined"
        accent={liveEventCount > 0 ? "warning" : "neutral"}
      />
      <StatCard
        label="High alerts"
        value={highAlertCount}
        hint="GDACS red or orange"
        accent={highAlertCount > 0 ? "critical" : "neutral"}
      />
      <StatCard
        label="Red alerts"
        value={redAlertCount}
        hint="Highest GDACS severity"
        accent={redAlertCount > 0 ? "critical" : "neutral"}
      />
      <StatCard
        label="GDACS live"
        value={gdacsLiveCount}
        hint="Active coordination events"
      />
      <StatCard
        label="NASA EONET"
        value={eonetCount}
        hint="Open events in India bbox"
      />
      <StatCard
        label="Historical"
        value={historicalCount}
        hint="GDACS archive (2000–present)"
        accent="neutral"
      />
    </section>
  );
};
