import type { CategoryBreakdown as CategoryBreakdownType } from "@/lib/dashboard/types";

type CategoryBreakdownProps = {
  items: CategoryBreakdownType[];
};

export const CategoryBreakdown = ({ items }: CategoryBreakdownProps) => {
  if (items.length === 0) {
    return (
      <section
        className="dashboard-panel rounded-xl border border-slate-800/80 p-4"
        aria-label="Event categories"
      >
        <h2 className="text-sm font-semibold text-slate-200">By category</h2>
        <p className="mt-2 text-sm text-slate-500">No live events to categorize.</p>
      </section>
    );
  }

  const max = Math.max(...items.map((item) => item.count));

  return (
    <section
      className="dashboard-panel rounded-xl border border-slate-800/80 p-4"
      aria-label="Event categories"
    >
      <h2 className="text-sm font-semibold text-slate-200">By category</h2>
      <p className="mt-0.5 text-xs text-slate-500">Live events grouped by hazard type</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-300">{item.label}</span>
              <span className="font-mono tabular-nums text-slate-500">{item.count}</span>
            </div>
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800"
              role="presentation"
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${max > 0 ? (item.count / max) * 100 : 0}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
