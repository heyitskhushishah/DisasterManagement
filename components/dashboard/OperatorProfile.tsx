import type { DashboardProfile } from "@/lib/dashboard/types";

type OperatorProfileProps = {
  profile: DashboardProfile | null;
  email: string;
};

const formatMemberSince = (iso: string | undefined) => {
  if (!iso) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const ProfileField = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div>
    <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
      {label}
    </dt>
    <dd className="mt-1 text-sm text-slate-200">{value}</dd>
  </div>
);

export const OperatorProfile = ({ profile, email }: OperatorProfileProps) => {
  const initials = (profile?.full_name ?? email)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <section
      className="dashboard-panel rounded-xl border border-slate-800/80 p-4"
      aria-label="Your operator profile"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10 text-sm font-semibold text-teal-200"
          aria-hidden
        >
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-100">
            {profile?.full_name ?? "Operator"}
          </h2>
          <p className="truncate text-xs text-slate-500">@{profile?.username ?? "—"}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <ProfileField label="Role" value={profile?.role ?? "—"} />
        <ProfileField
          label="Member since"
          value={formatMemberSince(profile?.created_at)}
        />
        <div className="sm:col-span-2">
          <ProfileField
            label="Organization"
            value={profile?.organization ?? "Not specified"}
          />
        </div>
        <ProfileField label="Email" value={email} />
        <ProfileField label="Phone" value={profile?.phone ?? "Not provided"} />
        <div className="sm:col-span-2">
          <ProfileField
            label="Emergency contact"
            value={profile?.emergency_contact ?? "Not provided"}
          />
        </div>
      </dl>
    </section>
  );
};
