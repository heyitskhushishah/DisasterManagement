import type { AIIntelligenceInput, RiskClassification } from "./types";

export function classifyRisk(value: number): RiskClassification {
  if (value <= 25) return "Low";
  if (value <= 50) return "Moderate";
  if (value <= 75) return "High";
  return "Critical";
}

function weatherConditionFactor(condition: string): number {
  const c = condition.toLowerCase();
  if (c.includes("thunderstorm") || c.includes("tornado") || c.includes("hurricane")) return 1;
  if (c.includes("storm") || c.includes("squall")) return 0.85;
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return 0.6;
  if (c.includes("snow") || c.includes("sleet") || c.includes("ice")) return 0.5;
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return 0.3;
  if (c.includes("cloud")) return 0.2;
  if (c.includes("clear") || c.includes("sunny")) return 0;
  return 0.15;
}

function disasterTypeFactor(dtype: string): number {
  const d = dtype.toLowerCase();
  if (d.includes("earthquake") || d.includes("cyclone") || d.includes("tsunami")) return 1;
  if (d.includes("flood") || d.includes("wildfire") || d.includes("volcano")) return 0.8;
  if (d.includes("storm") || d.includes("landslide")) return 0.6;
  if (d.includes("drought") || d.includes("extreme")) return 0.4;
  return 0.3;
}

export function computeRiskScores(input: AIIntelligenceInput) {
  const { severity, populationAffected, weather, facilities, disasterType } = input;

  const sev = Math.min(Math.max(severity, 1), 10);
  const pop = Math.min(populationAffected / 100000, 1);

  let avgHumidity = 0;
  let avgWind = 0;
  let avgCondition = "";
  let cityCount = 0;

  if (weather?.cities?.length) {
    for (const c of weather.cities) {
      avgHumidity += c.humidity ?? 0;
      avgWind += c.windSpeed ?? 0;
      avgCondition = c.condition ?? avgCondition;
      cityCount++;
    }
    if (cityCount > 0) {
      avgHumidity /= cityCount;
      avgWind /= cityCount;
    }
  }

  const humFactor = avgHumidity / 100;
  const windFactor = Math.min(avgWind / 60, 1);
  const condFactor = weatherConditionFactor(avgCondition);
  const dTypeFactor = disasterTypeFactor(disasterType);

  const facilityTypes = facilities?.facilities ?? [];
  const hospitalCount = facilityTypes.filter((f) => f.type === "hospital").length;
  const shelterCount = facilityTypes.filter((f) => f.type === "shelter").length;
  const totalFacilities = facilityTypes.length;

  const hospRatio = Math.min(hospitalCount / Math.max(Math.ceil(populationAffected / 5000), 1), 1);
  const facilityRatio = Math.min(totalFacilities / Math.max(Math.ceil(populationAffected / 2000), 1), 1);

  const floodRisk = Math.min(
    100,
    Math.round(
      condFactor * 28 +
        humFactor * 18 +
        sev * 4 +
        pop * 14 +
        windFactor * 10 +
        (dTypeFactor > 0.6 ? 16 : 0),
    ),
  );

  const hospitalOverloadRisk = Math.min(
    100,
    Math.round(
      sev * 8 +
        pop * 18 +
        (1 - hospRatio) * 32 +
        condFactor * 12 +
        (dTypeFactor > 0.7 ? 10 : 0),
    ),
  );

  const infrastructureDamageRisk = Math.min(
    100,
    Math.round(
      sev * 8 +
        dTypeFactor * 26 +
        windFactor * 14 +
        condFactor * 12 +
        pop * 10 +
        humFactor * 6,
    ),
  );

  const responseDelayRisk = Math.min(
    100,
    Math.round(
      (1 - facilityRatio) * 28 +
        (condFactor + windFactor) / 2 * 22 +
        sev * 7 +
        pop * 12 +
        (1 - hospRatio) * 14,
    ),
  );

  const summary = {
    floodRisk,
    hospitalOverloadRisk,
    infrastructureDamageRisk,
    responseDelayRisk,
  };

  return {
    ...summary,
    classifications: {
      floodRisk: classifyRisk(floodRisk),
      hospitalOverloadRisk: classifyRisk(hospitalOverloadRisk),
      infrastructureDamageRisk: classifyRisk(infrastructureDamageRisk),
      responseDelayRisk: classifyRisk(responseDelayRisk),
    },
    weatherSnapshot: weather ? { avgHumidity, avgWind, avgCondition } : null,
    facilitiesSummary: { hospitalCount, shelterCount, totalFacilities },
  };
}
