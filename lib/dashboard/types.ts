import type { GdacsAlertLevel } from "@/lib/map/gdacs";

export type DashboardProfile = {
  full_name: string;
  username: string;
  app_role: string;
  organization: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  emergency_contact: string | null;
  created_at: string;
};

export type DashboardLiveEvent = {
  id: string;
  title: string;
  typeLabel: string;
  source: "GDACS" | "EONET";
  alertLevel: GdacsAlertLevel | null;
  severity: string | null;
  occurredAt: string;
  link: string | null;
};

export type CategoryBreakdown = {
  id: string;
  label: string;
  count: number;
  color: string;
};

export type DashboardStats = {
  liveEventCount: number;
  eonetCount: number;
  gdacsLiveCount: number;
  historicalCount: number;
  highAlertCount: number;
  redAlertCount: number;
  orangeAlertCount: number;
  highestAlert: GdacsAlertLevel | null;
  categoryBreakdown: CategoryBreakdown[];
  liveEvents: DashboardLiveEvent[];
  lastRefreshed: string;
};
