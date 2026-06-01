export type RiskScore = {
  label: string;
  value: number;
  key: string;
};

export type RiskClassification = "Low" | "Moderate" | "High" | "Critical";

export type AIIntelligenceData = {
  id: string;
  disasterType: string | null;
  severity: number;
  populationAffected: number;
  floodRisk: number;
  hospitalOverloadRisk: number;
  infrastructureDamageRisk: number;
  responseDelayRisk: number;
  weatherSnapshot: Record<string, unknown> | null;
  facilitiesSummary: Record<string, unknown> | null;
  createdAt: string;
};

export type AIIntelligenceInput = {
  disasterType: string;
  severity: number;
  populationAffected: number;
  weather: { cities: { humidity: number; windSpeed: number; condition: string }[] } | null;
  facilities: { facilities: { type: string }[] } | null;
};
