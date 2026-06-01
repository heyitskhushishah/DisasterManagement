"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type { DispatchMission } from "./types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function useDispatchSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [missions, setMissions] = useState<DispatchMission[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", () => setConnected(false));

    s.on("dispatch:update", (data: DispatchMission[]) => {
      setMissions(data);
    });

    setSocket(s);
    return () => {
      s.close();
    };
  }, []);

  const createMission = (lat: number, lng: number, label?: string) => {
    socket?.emit("dispatch:create", { lat, lng, label });
  };

  const clearMissions = () => {
    socket?.emit("dispatch:clear");
  };

  return { socket, connected, missions, createMission, clearMissions };
}
