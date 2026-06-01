import type { FacilitiesData } from "@/lib/facilities/types";
import type { RouteData } from "@/lib/routing/types";
import type { WeatherData } from "@/lib/weather/types";
import type { Recommendation, RecommendationSeverity } from "./types";

type EngineInput = {
  weather: WeatherData | null;
  severity: number;
  populationAffected: number;
  disasterType: string;
  facilities: FacilitiesData | null;
  routeData: RouteData | null;
  weatherScore: number;
  floodRisk?: number;
  hospitalOverloadRisk?: number;
  infrastructureDamageRisk?: number;
  responseDelayRisk?: number;
};

function sev(s: RecommendationSeverity): number {
  return s === "Critical" ? 4 : s === "High" ? 3 : s === "Moderate" ? 2 : 1;
}

let counter = 0;
function rec(message: string, severity: RecommendationSeverity, category: Recommendation["category"]): Recommendation {
  counter++;
  return { id: `rec-${counter}-${Date.now()}`, message, severity, category };
}

function weatherCondition(w: WeatherData): string {
  return w.cities?.[0]?.condition?.toLowerCase() ?? "";
}

function avgWind(w: WeatherData): number {
  const ws = w.cities?.map((c) => c.windSpeed ?? 0) ?? [];
  return ws.reduce((a, b) => a + b, 0) / Math.max(ws.length, 1);
}

function avgHumidity(w: WeatherData): number {
  const hs = w.cities?.map((c) => c.humidity ?? 0) ?? [];
  return hs.reduce((a, b) => a + b, 0) / Math.max(hs.length, 1);
}

export function generateRecommendations(input: EngineInput): Recommendation[] {
  counter = 0;
  const result: Recommendation[] = [];

  const {
    weather, severity, populationAffected, disasterType,
    facilities, routeData, weatherScore,
    floodRisk, hospitalOverloadRisk, infrastructureDamageRisk, responseDelayRisk,
  } = input;

  const sevVal = Math.min(Math.max(severity, 1), 10);
  const popVal = populationAffected;
  const cond = weather ? weatherCondition(weather) : "";
  const wind = weather ? avgWind(weather) : 0;
  const hum = weather ? avgHumidity(weather) : 0;

  const hospitals = facilities?.facilities?.filter((f) => f.type === "hospital") ?? [];
  const shelters = facilities?.facilities?.filter((f) => f.type === "shelter") ?? [];
  const totalMed = hospitals.length;
  const totalShelters = shelters.length;

  const fr = floodRisk ?? 0;
  const hor = hospitalOverloadRisk ?? 0;
  const idr = infrastructureDamageRisk ?? 0;
  const rdr = responseDelayRisk ?? 0;

  // --- Weather-based ---
  const isStorm = cond.includes("thunderstorm") || cond.includes("storm") || cond.includes("tornado") || cond.includes("hurricane") || cond.includes("cyclone");
  const isRain = cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower");
  const isExtreme = cond.includes("extreme") || cond.includes("squall");

  if (isStorm || (wind > 40 && sevVal > 5)) {
    result.push(rec("Severe storm conditions may delay rescue operations. Ground teams should use caution.", "High", "weather"));
  }
  if (isRain && fr > 50) {
    result.push(rec("Severe rainfall may delay rescue operations in low-lying areas.", "High", "weather"));
  }
  if (wind > 50) {
    result.push(rec("High winds may hamper aerial rescue and drone operations.", "Moderate", "weather"));
  }
  if (hum > 85 && fr > 40) {
    result.push(rec("Sustained humidity above 85% increases flood risk. Monitor water levels.", "Moderate", "weather"));
  }
  if (weatherScore > 50 && sevVal > 6) {
    result.push(rec("Adverse weather compounding disaster impact. Prepare for cascading failures.", "High", "weather"));
  }

  // --- Medical / Hospital ---
  if (hor > 50) {
    if (hor > 75) {
      result.push(rec("Hospital nearing capacity. Consider patient redistribution and field hospital setup.", "Critical", "medical"));
    } else {
      result.push(rec("Hospital nearing capacity. Monitor bed availability closely.", "High", "medical"));
    }
  }
  if ((hor > 50 || sevVal > 7) && popVal > 10000) {
    result.push(rec("Dispatch additional ambulances to high-risk zones for mass casualty support.", "Critical", "medical"));
  }
  if (totalMed < 2 && popVal > 5000) {
    result.push(rec("Medical supply shortage risk. Request additional resources from neighboring regions.", "High", "medical"));
  }
  if (sevVal > 7 && hor > 60) {
    result.push(rec("Open temporary shelter for displaced population near medical facilities.", "High", "evacuation"));
  }

  // --- Evacuation / Shelter ---
  if (fr > 70) {
    result.push(rec("Mandatory evacuation recommended for low-lying and flood-prone areas.", "Critical", "evacuation"));
  }
  if (fr > 50) {
    result.push(rec("Pre-position sandbags and flood barriers in vulnerable zones.", "Moderate", "evacuation"));
  }
  if (totalShelters < 2 && popVal > 5000) {
    result.push(rec("Open temporary shelter for displaced population.", "High", "evacuation"));
  }
  if (totalShelters < 1 && sevVal > 5) {
    result.push(rec("Critical shelter shortage. Establish emergency relief camps immediately.", "Critical", "evacuation"));
  }

  // --- Infrastructure ---
  if (idr > 65) {
    result.push(rec("Infrastructure damage risk elevated. Deploy structural assessment teams.", "High", "infrastructure"));
  }
  if ((idr > 50 || fr > 60) && (disasterType.toLowerCase().includes("earthquake") || disasterType.toLowerCase().includes("cyclone"))) {
    result.push(rec("Bridge and road integrity checks recommended before deploying ground resources.", "Critical", "infrastructure"));
  }
  if (idr > 40 && sevVal > 6) {
    result.push(rec("Power grid vulnerability detected. Alert utility companies for rapid response.", "Moderate", "infrastructure"));
  }
  if (wind > 60 || isExtreme) {
    result.push(rec("Secure loose structures and deploy damage inspection teams post-event.", "Moderate", "infrastructure"));
  }

  // --- Logistics / Response ---
  if (rdr > 55) {
    result.push(rec("Response delays expected. Pre-position resources near affected areas.", "High", "logistics"));
  }
  if (routeData && routeData.routes.length > 0) {
    result.push(rec("Alternate route recommended to avoid hazard zones. Check route layer on map.", "Moderate", "logistics"));
  }
  if (rdr > 50 && popVal > 20000) {
    result.push(rec("Supply chain disruption likely. Activate emergency supply stockpiles.", "High", "logistics"));
  }
  if (routeData?.routes?.[0] && rdr > 40) {
    result.push(rec("Primary route risk elevated. Consider rerouting through safer corridors.", "Moderate", "logistics"));
  }

  // --- General ---
  if (sevVal >= 9) {
    result.push(rec("Catastrophic severity level. Activate full emergency response protocol.", "Critical", "logistics"));
  }
  if (popVal > 100000 && totalMed < 5) {
    result.push(rec("Mass casualty event risk. Request mobile medical units from national reserve.", "Critical", "medical"));
  }

  // Sort by severity descending, then by category
  result.sort((a, b) => {
    const sa = sev(a.severity);
    const sb = sev(b.severity);
    if (sa !== sb) return sb - sa;
    return a.category.localeCompare(b.category);
  });

  return result;
}
