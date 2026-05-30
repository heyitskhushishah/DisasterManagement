import type { FeatureCollection, Point } from "geojson";

import { INDIA_BOUNDS } from "@/lib/map/india-bounds";

/** EONET bbox: west, north, east, south (lng/lat order per NASA API). */
const [southWest, northEast] = INDIA_BOUNDS as [[number, number], [number, number]];
const EONET_BBOX = `${southWest[1]},${northEast[0]},${northEast[1]},${southWest[0]}`;

const EONET_CATEGORIES = [
  "wildfires",
  "severeStorms",
  "floods",
  "landslides",
  "earthquakes",
] as const;

export type EonetCategoryId = (typeof EONET_CATEGORIES)[number];

export type EonetCategory = {
  id: string;
  title: string;
};

export type EonetSource = {
  id: string;
  url: string;
};

export type EonetEventProperties = {
  id: string;
  title: string;
  description: string | null;
  link: string;
  closed: string | null;
  date: string;
  magnitudeValue: number | null;
  magnitudeUnit: string | null;
  categories: EonetCategory[];
  sources: EonetSource[];
};

export type EonetFeatureCollection = FeatureCollection<Point, EonetEventProperties>;

export const EONET_EVENTS_URL = `https://eonet.gsfc.nasa.gov/api/v3/events/geojson?bbox=${EONET_BBOX}&status=open&category=${EONET_CATEGORIES.join(",")}`;

/** Revalidate NASA feed hourly. */
export const EONET_REVALIDATE_SECONDS = 3600;

export const EMPTY_EONET_EVENTS: EonetFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export const normalizeEonetEvents = (
  events: EonetFeatureCollection | null | undefined,
): EonetFeatureCollection => {
  if (
    events &&
    events.type === "FeatureCollection" &&
    Array.isArray(events.features)
  ) {
    return events;
  }
  return EMPTY_EONET_EVENTS;
};

export const CATEGORY_MARKER_STYLES: Record<
  EonetCategoryId,
  { fillColor: string; color: string }
> = {
  wildfires: { fillColor: "#ea580c", color: "#9a3412" },
  severeStorms: { fillColor: "#7c3aed", color: "#5b21b6" },
  floods: { fillColor: "#2563eb", color: "#1e40af" },
  landslides: { fillColor: "#a16207", color: "#713f12" },
  earthquakes: { fillColor: "#e11d48", color: "#9f1239" },
};

const DEFAULT_MARKER_STYLE = { fillColor: "#71717a", color: "#3f3f46" };

export const getCategoryId = (
  properties: EonetEventProperties | null | undefined,
): string => properties?.categories?.[0]?.id ?? "unknown";

export const getMarkerStyleForCategory = (categoryId: string) =>
  CATEGORY_MARKER_STYLES[categoryId as EonetCategoryId] ?? DEFAULT_MARKER_STYLE;

export const decodeHtmlEntities = (value: string) =>
  value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">");

export const fetchEonetEvents = async (): Promise<EonetFeatureCollection> => {
  try {
    const response = await fetch(EONET_EVENTS_URL, {
      next: { revalidate: EONET_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.error("EONET fetch failed:", response.status, response.statusText);
      return EMPTY_EONET_EVENTS;
    }

    const data = (await response.json()) as EonetFeatureCollection;

    if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
      return EMPTY_EONET_EVENTS;
    }

    return {
      type: "FeatureCollection",
      features: data.features.filter((feature) => {
        const geom = feature.geometry;
        if (!geom) return false;
        if (geom.type === "Point") {
          return (
            Array.isArray(geom.coordinates) && geom.coordinates.length >= 2
          );
        }
        if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
          return true;
        }
        return false;
      }),
    };
  } catch (error) {
    console.error("EONET fetch error:", error);
    return EMPTY_EONET_EVENTS;
  }
};
