"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/sos/roles";
import { getAccessibleRoutes, ROLE_LABELS, ROLE_COLORS } from "@/lib/sos/roles";

type RoleNavProps = {
  role: AppRole;
  onNavigate?: () => void;
};

export function RoleNav({ role, onNavigate }: RoleNavProps) {
  const pathname = usePathname();
  const routes = getAccessibleRoutes(role);

  if (routes.length === 0) return null;

  return (
    <div className="space-y-1">
      <p
        className="px-3 text-[10px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: ROLE_COLORS[role] }}
      >
        {ROLE_LABELS[role]} Menu
      </p>
      {routes.map((route) => {
        const active = pathname === route.path || pathname.startsWith(route.path + "/");
        return (
          <Link
            key={route.path}
            href={route.path}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-teal-500/10 text-teal-300"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
            )}
          >
            <span className="text-base">{route.icon}</span>
            <span>{route.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

type RoleBadgeProps = {
  role: AppRole;
  className?: string;
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const color = ROLE_COLORS[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        className,
      )}
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
