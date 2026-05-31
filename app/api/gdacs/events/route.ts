import { NextResponse } from "next/server";

import type { FeatureCollection, Point } from "geojson";

const GDACS_BASE = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH";
const SUPPORTED_TYPES = new Set(["TC", "FL", "EQ", "WF", "VO", "DR", "TS"]);

const INDIA_LAT_MIN = 6;
const INDIA_LAT_MAX = 37;
const INDIA_LNG_MIN = 68;
const INDIA_LNG_MAX = 97;
const INDIA_ISO3 = "IND";

export const GET = async () => {
  try {
    const response = await fetch(GDACS_BASE, {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `GDACS request failed (${response.status})` },
        { status: response.status },
      );
    }

    const data = (await response.json()) as FeatureCollection<Point, Record<string, unknown>>;

    if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
      return NextResponse.json({ type: "FeatureCollection", features: [] });
    }

    const indiaFeatures = data.features.filter((f) => {
      if (f.geometry?.type !== "Point") return false;
      const coords = f.geometry.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return false;
      if (!SUPPORTED_TYPES.has(f.properties?.eventtype as string)) return false;

      const [lng, lat] = coords;
      if (lat >= INDIA_LAT_MIN && lat <= INDIA_LAT_MAX && lng >= INDIA_LNG_MIN && lng <= INDIA_LNG_MAX) {
        return true;
      }
      if (f.properties?.iso3 === INDIA_ISO3) return true;
      if ((f.properties?.country as string)?.toLowerCase() === "india") return true;

      const countries = f.properties?.affectedcountries as Array<{ iso3?: string; countryname?: string }>;
      if (countries) {
        return countries.some((c) => c.iso3 === INDIA_ISO3 || c.countryname?.toLowerCase() === "india");
      }

      return false;
    });

    return NextResponse.json(
      { type: "FeatureCollection", features: indiaFeatures },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=7200",
        },
      },
    );
  } catch (error) {
    console.error("[GDACS] events proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GDACS events" },
      { status: 502 },
    );
  }
};
