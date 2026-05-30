import type { Feature, FeatureCollection, Polygon, MultiPolygon, Position } from "geojson";

import type { GdacsEventProperties, GdacsFeatureCollection } from "@/lib/map/gdacs";

export type GdacsPolygonEventProperties = GdacsEventProperties & { isFallback?: boolean };

export type GdacsPolygonFeature = Feature<Polygon | MultiPolygon, GdacsPolygonEventProperties>;

export type GdacsPolygonCollection = FeatureCollection<Polygon | MultiPolygon, GdacsPolygonEventProperties>;

export const EMPTY_GDACS_POLYGONS: GdacsPolygonCollection = {
  type: "FeatureCollection",
  features: [],
};

const SEGMENTS = 64;

const createCircularBuffer = (
  center: Position,
  radiusKm: number,
): Polygon => {
  const [lng, lat] = center;
  const coords: Position[] = [];
  const latRad = (lat * Math.PI) / 180;
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos(latRad);

  for (let i = 0; i <= SEGMENTS; i++) {
    const angle = (i / SEGMENTS) * Math.PI * 2;
    const dx = radiusKm * Math.cos(angle);
    const dy = radiusKm * Math.sin(angle);
    coords.push([lng + dx / kmPerDegLng, lat + dy / kmPerDegLat]);
  }

  return { type: "Polygon", coordinates: [coords] };
};

const getRadius = (eventType: string, props: GdacsEventProperties): number => {
  switch (eventType) {
    case "EQ": {
      const mag = props.severitydata?.severity ?? 4;
      if (mag >= 8) return 400;
      if (mag >= 7) return 200;
      if (mag >= 6) return 100;
      if (mag >= 5) return 50;
      return 20;
    }
    case "WF": {
      const score = props.alertscore ?? 0;
      if (score > 50) return 30;
      if (score > 20) return 15;
      return 8;
    }
    case "VO":
      return 30;
    default:
      return 15;
  }
};

export const fetchGdacsPolygon = async (
  eventtype: string,
  eventid: number,
  episodeid: number,
  signal?: AbortSignal,
): Promise<GdacsPolygonCollection> => {
  try {
    const url = `https://www.gdacs.org/gdacsapi/api/polygons/getgeometry?eventtype=${eventtype}&eventid=${eventid}&episodeid=${episodeid}`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
      return EMPTY_GDACS_POLYGONS;
    }

    const data = (await response.json()) as FeatureCollection;

    if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
      return EMPTY_GDACS_POLYGONS;
    }

    const polygonFeatures = data.features.filter(
      (f): f is GdacsPolygonFeature =>
        f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
    );

    return { type: "FeatureCollection", features: polygonFeatures };
  } catch {
    return EMPTY_GDACS_POLYGONS;
  }
};

export const buildFallbackPolygon = (
  sourceProps: GdacsEventProperties,
  coords: Position,
): GdacsPolygonFeature => {
  const radius = getRadius(sourceProps.eventtype, sourceProps);
  return {
    type: "Feature",
    geometry: createCircularBuffer(coords, radius),
    properties: { ...sourceProps, eventid: sourceProps.eventid, isFallback: true },
  };
};

export const batchFetchGdacsPolygons = async (
  events: GdacsFeatureCollection,
): Promise<GdacsPolygonCollection> => {
  const allPolygons: GdacsPolygonFeature[] = [];

  const results = await Promise.allSettled(
    events.features.map((f) => {
      const sourceProps = f.properties;
      const coords = f.geometry.coordinates;

      if (sourceProps.eventtype === "FL" || sourceProps.eventtype === "TC") {
        return fetchGdacsPolygon(
          sourceProps.eventtype,
          sourceProps.eventid,
          sourceProps.episodeid,
        ).then((collection) => ({ sourceProps, coords, collection }));
      }

      return Promise.resolve({ sourceProps, coords, collection: EMPTY_GDACS_POLYGONS });
    }),
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;

    const { sourceProps, collection, coords } = result.value;

    if (collection.features.length > 0) {
      for (const f of collection.features) {
        allPolygons.push({
          ...f,
          properties: { ...sourceProps, ...f.properties, eventid: sourceProps.eventid },
        });
      }
    } else {
      allPolygons.push(buildFallbackPolygon(sourceProps, coords));
    }
  }

  return { type: "FeatureCollection", features: allPolygons };
};
