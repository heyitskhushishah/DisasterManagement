export type ResourceInputs = {
  disasterType: string;
  severity: number;
  populationAffected: number;
  weatherScore: number;
};

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ResourceAllocation = {
  ambulances: number;
  rescueTeams: number;
  shelters: number;
  medicalTeams: number;
  priorityScore: number;
  priority: Priority;
};

const DISASTER_MULTIPLIERS: Record<string, { ambulance: number; rescue: number; shelter: number; medical: number }> = {
  Flood: { ambulance: 0.6, rescue: 1.2, shelter: 1.5, medical: 0.5 },
  Fire: { ambulance: 1.2, rescue: 1.0, shelter: 0.8, medical: 1.0 },
  Earthquake: { ambulance: 1.5, rescue: 1.5, shelter: 1.8, medical: 1.5 },
  Cyclone: { ambulance: 1.0, rescue: 1.3, shelter: 1.6, medical: 0.8 },
  Landslide: { ambulance: 0.8, rescue: 1.1, shelter: 0.6, medical: 0.7 },
};

const DEFAULT_MULTIPLIERS = { ambulance: 0.5, rescue: 0.5, shelter: 0.5, medical: 0.5 };

export function calculateResources(inputs: ResourceInputs): ResourceAllocation {
  const { disasterType, severity, populationAffected, weatherScore } = inputs;

  const mult = DISASTER_MULTIPLIERS[disasterType] ?? DEFAULT_MULTIPLIERS;
  const sevFactor = severity / 5;
  const weatherFactor = 1 + weatherScore / 100;

  const rawAmbulances = populationAffected * mult.ambulance * sevFactor * weatherFactor * 0.01;
  const rawRescue = populationAffected * mult.rescue * sevFactor * weatherFactor * 0.008;
  const rawShelters = populationAffected * mult.shelter * sevFactor * 0.005;
  const rawMedical = populationAffected * mult.medical * sevFactor * weatherFactor * 0.006;

  const ambulances = Math.max(Math.ceil(rawAmbulances), 2);
  const rescueTeams = Math.max(Math.ceil(rawRescue), 1);
  const shelters = Math.max(Math.ceil(rawShelters), 1);
  const medicalTeams = Math.max(Math.ceil(rawMedical), 1);

  const sevWeight = severity * 8;
  const popWeight = Math.min(populationAffected / 100, 30);
  const weatherWeight = weatherScore * 0.2;
  const typeWeight = disasterType ? 5 : 0;

  const priorityScore = Math.min(Math.round(sevWeight + popWeight + weatherWeight + typeWeight), 100);

  let priority: Priority = "LOW";
  if (priorityScore >= 75) priority = "CRITICAL";
  else if (priorityScore >= 55) priority = "HIGH";
  else if (priorityScore >= 30) priority = "MEDIUM";

  return { ambulances, rescueTeams, shelters, medicalTeams, priorityScore, priority };
}
