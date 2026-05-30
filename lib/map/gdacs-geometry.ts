import type { Feature, FeatureCollection, Geometry } from "geojson";

import type { GdacsEventProperties } from "@/lib/map/gdacs";

const GDACS_GEOMETRY_BASE =
  "https://www.gdacs.org/gdacsapi/api/polygons/getgeometry";

const AREA_GEOMETRY_TYPES = new Set<Geometry["type"]>([
  "Polygon",
  "MultiPolygon",
]);

const isAreaGeometry = (
  geometry: Geometry | null | undefined,
): geometry is Extract<Geometry, { type: "Polygon" | "MultiPolygon" }> =>
  Boolean(geometry?.type && AREA_GEOMETRY_TYPES.has(geometry.type));

const getPolygonLabel = (feature: Feature): string => {
  const properties = feature.properties as Record<string, unknown> | null;
  const label = properties?.polygonlabel ?? properties?.Class;
  return typeof label === "string" ? label.toLowerCase() : "";
};

const isAffectedAreaFeature = (feature: Feature): boolean => {
  if (!isAreaGeometry(feature.geometry)) {
    return false;
  }

  const label = getPolygonLabel(feature);
  if (label.includes("centroid")) {
    return false;
  }

  return label.includes("affected");
};

const isNonCentroidAreaFeature = (feature: Feature): boolean => {
  if (!isAreaGeometry(feature.geometry)) {
    return false;
  }

  return !getPolygonLabel(feature).includes("centroid");
};

export const buildGdacsGeometryUrl = (
  eventtype: string,
  eventid: number,
  episodeid: number,
): string => {
  const params = new URLSearchParams({
    eventtype,
    eventid: String(eventid),
    episodeid: String(episodeid),
  });
  return `${GDACS_GEOMETRY_BASE}?${params.toString()}`;
};

export const isFeatureCollection = (
  value: unknown,
): value is FeatureCollection => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as FeatureCollection;
  return (
    candidate.type === "FeatureCollection" &&
    Array.isArray(candidate.features)
  );
};

/** Prefer “Affected area” polygons; fall back to other non-centroid area features. */
export const extractAffectedAreaPolygons = (
  collection: FeatureCollection,
): FeatureCollection => {
  const affected = collection.features.filter(isAffectedAreaFeature);
  const features =
    affected.length > 0
      ? affected
      : collection.features.filter(isNonCentroidAreaFeature);

  return {
    type: "FeatureCollection",
    features,
  };
};

export type GdacsAreaPathOptions = {
  color: string;
  weight: number;
  fillColor: string;
  fillOpacity: number;
};

export const getGdacsAreaPathOptions = (
  alertlevel: GdacsEventProperties["alertlevel"] | undefined,
): GdacsAreaPathOptions => {
  if (alertlevel === "Red") {
    return {
      color: "#dc2626",
      weight: 2,
      fillColor: "#ef4444",
      fillOpacity: 0.25,
    };
  }

  if (alertlevel === "Orange") {
    return {
      color: "#ea580c",
      weight: 2,
      fillColor: "#f97316",
      fillOpacity: 0.22,
    };
  }

  return {
    color: "#16a34a",
    weight: 2,
    fillColor: "#22c55e",
    fillOpacity: 0.18,
  };
};
