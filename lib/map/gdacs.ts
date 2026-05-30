import type { FeatureCollection, Point } from "geojson";

import {
  CATEGORY_MARKER_STYLES,
  type EonetCategoryId,
} from "@/lib/map/eonet";

const GDACS_BASE = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH";

export type GdacsAlertLevel = "Red" | "Orange" | "Green";

export type GdacsUrl = {
  geometry: string;
  report: string;
  details: string;
};

export type GdacsSeverityData = {
  severity: number | null;
  severitytext: string | null;
  severityunit: string | null;
};

export type GdacsAffectedCountry = {
  iso2: string;
  iso3: string;
  countryname: string;
};

export type GdacsEventProperties = {
  eventtype: string;
  eventid: number;
  episodeid: number;
  eventname: string;
  name: string;
  description: string;
  htmldescription: string;
  alertlevel: GdacsAlertLevel;
  alertscore: number;
  episodealertlevel: GdacsAlertLevel;
  episodealertscore: number;
  country: string;
  fromdate: string;
  todate: string;
  datemodified: string;
  iso3: string;
  url: GdacsUrl;
  icon: string;
  iconoverall: string;
  severitydata: GdacsSeverityData;
  affectedcountries: GdacsAffectedCountry[];
};

export type GdacsFeatureCollection = FeatureCollection<Point, GdacsEventProperties>;

export type GdacsEventType = "TC" | "FL" | "EQ" | "WF" | "VO" | "DR" | "TS";

const INDIA_LAT_MIN = 6;
const INDIA_LAT_MAX = 37;
const INDIA_LNG_MIN = 68;
const INDIA_LNG_MAX = 97;

const INDIA_ISO3 = "IND";

const GDACS_TO_EONET: Record<string, EonetCategoryId> = {
  TC: "severeStorms",
  FL: "floods",
  EQ: "earthquakes",
  WF: "wildfires",
};

const SUPPORTED_GDACS_TYPES = new Set(["TC", "FL", "EQ", "WF", "VO", "DR", "TS"]);

export const EMPTY_GDACS_EVENTS: GdacsFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export const normalizeGdacsEvents = (
  events: GdacsFeatureCollection | null | undefined,
): GdacsFeatureCollection => {
  if (
    events &&
    events.type === "FeatureCollection" &&
    Array.isArray(events.features)
  ) {
    return events;
  }
  return EMPTY_GDACS_EVENTS;
};

export const isInIndia = (feature: GdacsFeatureCollection["features"][number]): boolean => {
  const coords = feature.geometry?.coordinates;
  if (coords && coords.length >= 2) {
    const [lng, lat] = coords;
    if (
      lat >= INDIA_LAT_MIN &&
      lat <= INDIA_LAT_MAX &&
      lng >= INDIA_LNG_MIN &&
      lng <= INDIA_LNG_MAX
    ) {
      return true;
    }
  }

  const props = feature.properties;
  if (!props) return false;

  if (props.country?.toLowerCase() === "india") return true;
  if (props.iso3 === INDIA_ISO3) return true;

  if (props.affectedcountries) {
    return props.affectedcountries.some(
      (c) =>
        c.countryname?.toLowerCase() === "india" || c.iso3 === INDIA_ISO3,
    );
  }

  return false;
};

export const filterIndiaEvents = (
  events: GdacsFeatureCollection,
): GdacsFeatureCollection => {
  if (!events?.features) return EMPTY_GDACS_EVENTS;

  return {
    type: "FeatureCollection",
    features: events.features.filter(isInIndia),
  };
};

export const getGdacsEonetCategory = (
  eventType: string,
): EonetCategoryId | null => {
  return GDACS_TO_EONET[eventType] ?? null;
};

const GDACS_TYPE_COLORS: Record<string, { fillColor: string; color: string }> = {
  VO: { fillColor: "#7f1d1d", color: "#450a0a" },
  DR: { fillColor: "#a16207", color: "#713f12" },
  TS: { fillColor: "#0e7490", color: "#164e63" },
};

export const getGdacsMarkerStyle = (eventType: string) => {
  const gdacsColor = GDACS_TYPE_COLORS[eventType];
  if (gdacsColor) return gdacsColor;

  const eonetCategory = getGdacsEonetCategory(eventType);
  if (eonetCategory && CATEGORY_MARKER_STYLES[eonetCategory]) {
    return CATEGORY_MARKER_STYLES[eonetCategory];
  }
  return { fillColor: "#71717a", color: "#3f3f46" };
};

export const formatGdacsType = (eventType: string): string => {
  const map: Record<string, string> = {
    TC: "Tropical Cyclone",
    TS: "Tsunami",
    FL: "Flood",
    EQ: "Earthquake",
    WF: "Wildfire",
    VO: "Volcano",
    DR: "Drought",
  };
  return map[eventType] ?? eventType;
};

export const fetchGdacsEvents = async (): Promise<GdacsFeatureCollection> => {
  try {
    const response = await fetch(GDACS_BASE, {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      console.error("GDACS fetch failed:", response.status, response.statusText);
      return EMPTY_GDACS_EVENTS;
    }

    const data = (await response.json()) as GdacsFeatureCollection;

    if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
      return EMPTY_GDACS_EVENTS;
    }

    const validFeatures = data.features.filter(
      (feature) =>
        feature.geometry?.type === "Point" &&
        Array.isArray(feature.geometry.coordinates) &&
        feature.geometry.coordinates.length >= 2 &&
        SUPPORTED_GDACS_TYPES.has(feature.properties?.eventtype),
    );

    return {
      type: "FeatureCollection",
      features: validFeatures,
    };
  } catch (error) {
    console.error("GDACS fetch error:", error);
    return EMPTY_GDACS_EVENTS;
  }
};
