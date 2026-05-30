import type { DashboardLiveEvent } from "@/lib/dashboard/types";

type ActiveEventsPanelProps = {
  events: DashboardLiveEvent[];
};

const formatOccurredAt = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const alertBadgeClass = (level: DashboardLiveEvent["alertLevel"]) => {
  if (level === "Red") {
    return "border-red-500/40 bg-red-500/15 text-red-300";
  }
  if (level === "Orange") {
    return "border-amber-500/40 bg-amber-500/15 text-amber-200";
  }
  if (level === "Green") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }
  return "border-slate-700 bg-slate-800/80 text-slate-400";
};

export const ActiveEventsPanel = ({ events }: ActiveEventsPanelProps) => {
  return (
    <section
      className="dashboard-panel flex max-h-[28rem] flex-col rounded-xl border border-slate-800/80"
      aria-label="Active disaster events"
    >
      <div className="border-b border-slate-800/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-200">Active events</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Sorted by alert priority, then recency
        </p>
      </div>

      {events.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          No open events in the India monitoring region. The map remains available
          for historical context.
        </p>
      ) : (
        <ul className="divide-y divide-slate-800/80 overflow-y-auto">
          {events.map((event) => (
            <li key={event.id} className="px-4 py-3 transition hover:bg-slate-800/30">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {event.typeLabel} · {event.source}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${alertBadgeClass(event.alertLevel)}`}
                >
                  {event.alertLevel ?? "Open"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <time dateTime={event.occurredAt}>{formatOccurredAt(event.occurredAt)}</time>
                {event.severity ? <span>Severity: {event.severity}</span> : null}
              </div>
              {event.link ? (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-teal-400 hover:text-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                >
                  View source report →
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
