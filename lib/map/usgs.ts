import type { FeatureCollection, Point } from "geojson";

import { INDIA_BOUNDS } from "@/lib/map/india-bounds";

const [southWest, northEast] = INDIA_BOUNDS as [[number, number], [number, number]];

export const USGS_MIN_MAGNITUDE = 2.5;

export const USGS_DAYS_BACK = 30;

export const buildUsgsUrl = (): string => {
  const end = new Date();
  const start = new Date(Date.now() - USGS_DAYS_BACK * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return [
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson`,
    `&starttime=${fmt(start)}`,
    `&endtime=${fmt(end)}`,
    `&minlatitude=${southWest[0]}`,
    `&maxlatitude=${northEast[0]}`,
    `&minlongitude=${southWest[1]}`,
    `&maxlongitude=${northEast[1]}`,
    `&minmagnitude=${USGS_MIN_MAGNITUDE}`,
    `&orderby=magnitude`,
  ].join("");
};

export type UsgsEventProperties = {
  mag: number;
  place: string;
  time: number;
  updated: number;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  magType: string;
  type: string;
  title: string;
};

export type UsgsFeatureCollection = FeatureCollection<Point, UsgsEventProperties>;

export const EMPTY_USGS_EVENTS: UsgsFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export const normalizeUsgsEvents = (
  events: UsgsFeatureCollection | null | undefined,
): UsgsFeatureCollection => {
  if (
    events &&
    events.type === "FeatureCollection" &&
    Array.isArray(events.features)
  ) {
    return events;
  }
  return EMPTY_USGS_EVENTS;
};

const MAG_COLORS: [number, string][] = [
  [8, "#7f1d1d"],
  [6, "#dc2626"],
  [5, "#ea580c"],
  [4, "#d97706"],
  [3, "#a16207"],
  [0, "#57534e"],
];

export const getUsgsMarkerColor = (mag: number): string => {
  for (const [threshold, color] of MAG_COLORS) {
    if (mag >= threshold) return color;
  }
  return "#57534e";
};

export const getUsgsRadius = (mag: number): number => {
  return Math.max(4, Math.min(16, mag * 2.5));
};

export const formatUsgsTime = (ms: number): string => {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(ms));
  } catch {
    return String(ms);
  }
};
