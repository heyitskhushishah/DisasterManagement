export type RecommendationSeverity = "Critical" | "High" | "Moderate" | "Low";
export type RecommendationCategory = "weather" | "medical" | "evacuation" | "logistics" | "infrastructure";

export type Recommendation = {
  id: string;
  message: string;
  severity: RecommendationSeverity;
  category: RecommendationCategory;
};

export const SEVERITY_ORDER: RecommendationSeverity[] = ["Critical", "High", "Moderate", "Low"];

export const SEVERITY_COLORS: Record<RecommendationSeverity, string> = {
  Critical: "#dc2626",
  High: "#f97316",
  Moderate: "#f59e0b",
  Low: "#16a34a",
};
