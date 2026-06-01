export type AssetType = "ambulance" | "rescue_team" | "fire_truck";

export type DispatchStatus = "Assigned" | "En Route" | "On Scene" | "Completed";

export type Asset = {
  id: string;
  type: AssetType;
  label: string;
  status: DispatchStatus;
  lat: number;
  lng: number;
  targetLat: number;
  targetLng: number;
  progress: number;
  eta: number;
  startedAt: number;
};

export type DispatchMission = {
  id: string;
  incidentId: string;
  incidentLabel: string;
  incidentLat: number;
  incidentLng: number;
  assets: Asset[];
  status: DispatchStatus;
  createdAt: number;
};

export const ASSET_ICONS: Record<AssetType, string> = {
  ambulance: "🚑",
  rescue_team: "🦺",
  fire_truck: "🚒",
};

export const STATUS_ORDER: DispatchStatus[] = ["Assigned", "En Route", "On Scene", "Completed"];

export const STATUS_COLORS: Record<DispatchStatus, string> = {
  Assigned: "#94a3b8",
  "En Route": "#f59e0b",
  "On Scene": "#3b82f6",
  Completed: "#16a34a",
};
