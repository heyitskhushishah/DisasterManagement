import type { Asset, AssetType, DispatchMission, DispatchStatus } from "./types";

const ASSETS: AssetType[] = ["ambulance", "rescue_team", "fire_truck"];

const ASSET_LABELS: Record<AssetType, string> = {
  ambulance: "Ambulance",
  rescue_team: "Rescue Team",
  fire_truck: "Fire Truck",
};

let missionCounter = 0;

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function randomNearby(lat: number, lng: number, rangeKm: number): { lat: number; lng: number } {
  const kmPerDeg = 111;
  const dLat = ((Math.random() - 0.5) * rangeKm * 2) / kmPerDeg;
  const dLng = ((Math.random() - 0.5) * rangeKm * 2) / (kmPerDeg * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

function avgSpeed(type: AssetType): number {
  switch (type) {
    case "ambulance": return 60;
    case "fire_truck": return 50;
    case "rescue_team": return 40;
  }
}

export function createMission(
  incidentLat: number,
  incidentLng: number,
  incidentLabel: string,
): DispatchMission {
  missionCounter++;
  const id = `mission-${missionCounter}-${Date.now()}`;

  const assets: Asset[] = ASSETS.map((type, i) => {
    const start = randomNearby(incidentLat, incidentLng, 15);
    const distKm = haversineKm(start.lat, start.lng, incidentLat, incidentLng);
    const speed = avgSpeed(type);
    return {
      id: `${id}-${type}`,
      type,
      label: `${ASSET_LABELS[type]} #${missionCounter}`,
      status: "Assigned" as DispatchStatus,
      lat: start.lat,
      lng: start.lng,
      targetLat: incidentLat + (Math.random() - 0.5) * 0.01,
      targetLng: incidentLng + (Math.random() - 0.5) * 0.01,
      progress: 0,
      eta: Math.round((distKm / speed) * 3600),
      startedAt: Date.now(),
    };
  });

  return {
    id,
    incidentId: `inc-${missionCounter}`,
    incidentLabel,
    incidentLat,
    incidentLng,
    assets,
    status: "Assigned",
    createdAt: Date.now(),
  };
}

export function tickMission(mission: DispatchMission): DispatchMission {
  const now = Date.now();
  const allCompleted = mission.assets.every((a) => a.status === "Completed");
  const allOnScene = mission.assets.every(
    (a) => a.status === "On Scene" || a.status === "Completed",
  );
  const anyEnRoute = mission.assets.some((a) => a.status === "En Route");

  const assets = mission.assets.map((asset) => {
    let { status, progress, lat, lng, eta, startedAt } = asset;

    const totalDist = haversineKm(
      lat, lng,
      asset.targetLat, asset.targetLng,
    );
    const speed = avgSpeed(asset.type);
    const totalTimeSec = (totalDist / speed) * 3600;

    switch (status) {
      case "Assigned":
        if (now - startedAt > 2000) {
          status = "En Route";
          startedAt = now;
        }
        break;

      case "En Route": {
        const elapsedSec = (now - startedAt) / 1000;
        progress = Math.min(elapsedSec / totalTimeSec, 0.95);
        const frac = progress;
        lat += (asset.targetLat - lat) * 0.05;
        lng += (asset.targetLng - lng) * 0.05;
        eta = Math.max(Math.round((1 - frac) * totalTimeSec), 0);
        if (progress >= 0.9) {
          status = "On Scene";
          startedAt = now;
          progress = 1;
          eta = 0;
        }
        break;
      }

      case "On Scene":
        if (now - startedAt > 4000) {
          status = "Completed";
        }
        progress = 1;
        eta = 0;
        break;

      case "Completed":
        progress = 1;
        eta = 0;
        break;
    }

    return { ...asset, status, progress, lat, lng, eta, startedAt };
  });

  let missionStatus: DispatchStatus = "Assigned";
  if (allCompleted) missionStatus = "Completed";
  else if (allOnScene) missionStatus = "On Scene";
  else if (anyEnRoute) missionStatus = "En Route";

  return { ...mission, assets, status: missionStatus };
}
