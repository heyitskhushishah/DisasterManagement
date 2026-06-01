import type { RouteRisk } from "./types";

export function calculateRouteRisk(
  distance: number,
  weatherScore: number,
  severity: number,
): RouteRisk {
  const distKm = distance / 1000;
  const distFactor = Math.min(distKm / 100, 1) * 20;
  const weatherFactor = weatherScore * 0.3;
  const sevFactor = severity * 4;
  const total = Math.min(Math.round(distFactor + weatherFactor + sevFactor), 100);

  let label: RouteRisk["label"] = "Low";
  if (total >= 70) label = "Critical";
  else if (total >= 50) label = "High";
  else if (total >= 30) label = "Moderate";

  return { label, score: total };
}
