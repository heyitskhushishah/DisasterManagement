import { createHash } from "node:crypto";

import type { Feature } from "geojson";

const hashFeature = (feature: Feature): string => {
  return createHash("sha256").update(JSON.stringify(feature)).digest("hex");
};

export const getGdacsFeatureDedupeKey = (feature: Feature): string => {
  const properties = feature.properties as Record<string, unknown> | null;

  if (properties) {
    const { eventtype, eventid, episodeid, fromdate, todate } = properties;

    if (eventtype != null && eventid != null) {
      return `${String(eventtype)}:${String(eventid)}:${String(episodeid ?? "")}:${String(fromdate ?? "")}:${String(todate ?? "")}`;
    }
  }

  return `hash:${hashFeature(feature)}`;
};

/** Keeps the first occurrence for each dedupe key; preserves geometry and properties. */
export const dedupeGdacsFeatures = (features: Feature[]): Feature[] => {
  const seen = new Set<string>();
  const unique: Feature[] = [];

  for (const feature of features) {
    const key = getGdacsFeatureDedupeKey(feature);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(feature);
  }

  return unique;
};
