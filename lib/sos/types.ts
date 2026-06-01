// ============================================================
// TypeScript types for Civilian SOS Emergency Request System
// Mirrors supabase/migrations/20260601000002_add_sos_system.sql
// ============================================================

// --- Enums ---

export type EmergencyType =
  | "medical"
  | "fire"
  | "flood"
  | "earthquake"
  | "cyclone"
  | "landslide"
  | "structural_collapse"
  | "road_accident"
  | "missing_person"
  | "other";

export type SosSeverity = "critical" | "high" | "moderate" | "low";

export type SosStatus =
  | "pending"
  | "acknowledged"
  | "in_progress"
  | "rescued"
  | "closed"
  | "cancelled";

export type AssignmentRole =
  | "rescuer"
  | "medic"
  | "coordinator"
  | "driver"
  | "spotter";

export type MediaType = "image" | "video" | "audio";

// --- Profile (extended) ---

export type Profile = {
  id: string;
  username: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  role: string;
  emergency_contact: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

// --- SOS Request ---

export type SosImmediateNeeds = string[];

export type SosAccessibilityFlags = {
  wheelchair?: boolean;
  stretcher_needed?: boolean;
  visual_impairment?: boolean;
  hearing_impairment?: boolean;
  mobility_limited?: boolean;
  [key: string]: boolean | undefined;
};

export type SosRequest = {
  id: string;
  ticket_number: string;
  user_id: string;
  emergency_type: EmergencyType;
  severity: SosSeverity;
  adults_count: number;
  children_count: number;
  elderly_count: number;
  injured_count: number;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string | null;
  immediate_needs: SosImmediateNeeds;
  accessibility_flags: SosAccessibilityFlags;
  phone_number: string | null;
  alternate_contact: string | null;
  status: SosStatus;
  created_at: string;
  updated_at: string;
};

// Input for creating a new SOS request (omits server-generated fields)
export type SosRequestInput = {
  emergency_type: EmergencyType;
  severity?: SosSeverity;
  adults_count?: number;
  children_count?: number;
  elderly_count?: number;
  injured_count?: number;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  immediate_needs?: SosImmediateNeeds;
  accessibility_flags?: SosAccessibilityFlags;
  phone_number?: string;
  alternate_contact?: string;
};

// --- SOS Media ---

export type SosMedia = {
  id: string;
  request_id: string;
  user_id: string;
  media_type: MediaType;
  storage_path: string;
  created_at: string;
};

// --- Rescue Assignment ---

export type RescueAssignment = {
  id: string;
  request_id: string;
  assigned_team: string;
  assigned_role: AssignmentRole;
  assigned_to: string;
  eta: number | null;
  dispatch_time: string | null;
  completion_time: string | null;
  created_at: string;
};

export type RescueAssignmentInput = {
  request_id: string;
  assigned_team: string;
  assigned_role?: AssignmentRole;
  assigned_to: string;
  eta?: number;
  dispatch_time?: string;
};

// --- Request Status History ---

export type RequestStatusHistory = {
  id: string;
  request_id: string;
  old_status: SosStatus | null;
  new_status: SosStatus;
  changed_by: string;
  notes: string | null;
  created_at: string;
};

// --- Composite / API types ---

export type SosRequestWithDetails = SosRequest & {
  media: SosMedia[];
  assignments: RescueAssignment[];
  status_history: RequestStatusHistory[];
  profile: Pick<Profile, "full_name" | "phone" | "avatar_url">;
};

export type SosDashboardStats = {
  total_active: number;
  critical_count: number;
  pending_acknowledgement: number;
  in_progress: number;
  rescued_today: number;
  avg_response_time_minutes: number | null;
};

// --- Severity metadata helpers ---

export const SOS_SEVERITY_CONFIG: Record<
  SosSeverity,
  { label: string; color: string; sort_order: number }
> = {
  critical: { label: "Critical", color: "#dc2626", sort_order: 0 },
  high: { label: "High", color: "#f97316", sort_order: 1 },
  moderate: { label: "Moderate", color: "#f59e0b", sort_order: 2 },
  low: { label: "Low", color: "#16a34a", sort_order: 3 },
};

export const SOS_STATUS_CONFIG: Record<
  SosStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "#94a3b8" },
  acknowledged: { label: "Acknowledged", color: "#3b82f6" },
  in_progress: { label: "In Progress", color: "#f59e0b" },
  rescued: { label: "Rescued", color: "#16a34a" },
  closed: { label: "Closed", color: "#64748b" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
};
