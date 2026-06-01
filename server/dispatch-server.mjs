import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);

let missionIdCounter = 0;

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const randomNearby = (lat, lng, rangeKm) => {
  const kmPerDeg = 111;
  const dLat = ((Math.random() - 0.5) * rangeKm * 2) / kmPerDeg;
  const dLng =
    ((Math.random() - 0.5) * rangeKm * 2) /
    (kmPerDeg * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
};

const avgSpeed = (type) => {
  if (type === "ambulance") return 60;
  if (type === "fire_truck") return 50;
  return 40;
};

const activeMissions = new Map();
let simulationInterval = null;

const createMission = (incidentLat, incidentLng, incidentLabel) => {
  missionIdCounter++;
  const id = `mission-${missionIdCounter}-${Date.now()}`;
  const types = ["ambulance", "rescue_team", "fire_truck"];
  const labels = { ambulance: "Ambulance", rescue_team: "Rescue Team", fire_truck: "Fire Truck" };

  const assets = types.map((type) => {
    const start = randomNearby(incidentLat, incidentLng, 15);
    const distKm = haversineKm(start.lat, start.lng, incidentLat, incidentLng);
    const speed = avgSpeed(type);
    return {
      id: `${id}-${type}`,
      type,
      label: `${labels[type]} #${missionIdCounter}`,
      status: "Assigned",
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
    incidentId: `inc-${missionIdCounter}`,
    incidentLabel,
    incidentLat,
    incidentLng,
    assets,
    status: "Assigned",
    createdAt: Date.now(),
  };
};

const tickMission = (mission) => {
  const now = Date.now();
  const assets = mission.assets.map((asset) => {
    let { status, progress, lat, lng, eta, startedAt } = asset;
    const totalDist = haversineKm(lat, lng, asset.targetLat, asset.targetLng);
    const speed = avgSpeed(asset.type);
    const totalTimeSec = (totalDist / speed) * 3600;

    if (status === "Assigned" && now - startedAt > 2000) {
      status = "En Route";
      startedAt = now;
    } else if (status === "En Route") {
      const elapsedSec = (now - startedAt) / 1000;
      progress = Math.min(elapsedSec / totalTimeSec, 0.95);
      lat += (asset.targetLat - lat) * 0.05;
      lng += (asset.targetLng - lng) * 0.05;
      eta = Math.max(Math.round((1 - progress) * totalTimeSec), 0);
      if (progress >= 0.9) {
        status = "On Scene";
        startedAt = now;
        progress = 1;
        eta = 0;
      }
    } else if (status === "On Scene" && now - startedAt > 4000) {
      status = "Completed";
    }

    return { ...asset, status, progress, lat, lng, eta, startedAt };
  });

  const allCompleted = assets.every((a) => a.status === "Completed");
  const allOnScene = assets.every((a) => a.status === "On Scene" || a.status === "Completed");
  const anyEnRoute = assets.some((a) => a.status === "En Route");

  let missionStatus = "Assigned";
  if (allCompleted) missionStatus = "Completed";
  else if (allOnScene) missionStatus = "On Scene";
  else if (anyEnRoute) missionStatus = "En Route";

  return { ...mission, assets, status: missionStatus };
};

const broadcastMissions = (io) => {
  const snapshot = Array.from(activeMissions.values()).map((m) => tickMission(m));
  for (const m of snapshot) activeMissions.set(m.id, m);
  io.emit("dispatch:update", snapshot);
};

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`[Dispatch] Client connected: ${socket.id}`);
  socket.emit("dispatch:update", Array.from(activeMissions.values()));

  socket.on("dispatch:create", (data) => {
    const mission = createMission(data.lat, data.lng, data.label || "Incident");
    activeMissions.set(mission.id, mission);
    io.emit("dispatch:update", Array.from(activeMissions.values()));
  });

  socket.on("dispatch:clear", () => {
    activeMissions.clear();
    io.emit("dispatch:update", []);
  });

  socket.on("disconnect", () => {
    console.log(`[Dispatch] Client disconnected: ${socket.id}`);
  });
});

if (!simulationInterval) {
  simulationInterval = setInterval(() => {
    if (activeMissions.size > 0) broadcastMissions(io);
  }, 1500);
}

httpServer.listen(PORT, () => {
  console.log(`[Dispatch] Socket.IO server running on port ${PORT}`);
});
