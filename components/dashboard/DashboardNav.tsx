import { signOut } from "@/lib/auth/actions";

type DashboardNavProps = {
  displayName: string;
  role: string;
};

export const DashboardNav = ({ displayName, role }: DashboardNavProps) => {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-800/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-teal-400/90">
          Relief operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
          Command dashboard
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
          Welcome back,{" "}
          <span className="font-medium text-slate-200">{displayName}</span>.
          Monitor active hazards across India and coordinate your response.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-200">
          {role}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
};
