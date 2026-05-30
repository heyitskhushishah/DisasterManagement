import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Feature, Point } from "geojson";

import {
  EMPTY_GDACS_EVENTS,
  normalizeGdacsEvents,
  type GdacsEventProperties,
  type GdacsFeatureCollection,
} from "@/lib/map/gdacs";

const HISTORICAL_FILES = [
  "gdacs_india_2000_2026.geojson",
  "gdacs_india_smoke_2024_01.geojson",
] as const;

const isValidHistoricalPoint = (
  feature: Feature,
): feature is Feature<Point, GdacsEventProperties> => {
  if (feature.geometry?.type !== "Point") {
    return false;
  }

  const coordinates = feature.geometry.coordinates;
  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number" &&
    Boolean(feature.properties?.eventtype) &&
    feature.properties?.eventid != null
  );
};

const normalizeHistoricalFeatures = (
  collection: GdacsFeatureCollection,
): GdacsFeatureCollection => ({
  type: "FeatureCollection",
  features: collection.features.filter(isValidHistoricalPoint),
});

export const loadHistoricalGdacsEvents =
  async (): Promise<GdacsFeatureCollection> => {
    const dataDir = path.join(process.cwd(), "data");

    for (const filename of HISTORICAL_FILES) {
      try {
        const filePath = path.join(dataDir, filename);
        const raw = await readFile(filePath, "utf8");
        const parsed: unknown = JSON.parse(raw);
        const normalized = normalizeHistoricalFeatures(
          normalizeGdacsEvents(parsed as GdacsFeatureCollection),
        );

        if (normalized.features.length > 0) {
          console.log(
            `[GDACS] Loaded ${normalized.features.length} historical events from ${filename}`,
          );
          return normalized;
        }
      } catch {
        // Try next candidate file.
      }
    }

    return EMPTY_GDACS_EVENTS;
  };
