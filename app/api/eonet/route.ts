import { NextResponse } from "next/server";

import { INDIA_BOUNDS } from "@/lib/map/india-bounds";

const [southWest, northEast] = INDIA_BOUNDS as [[number, number], [number, number]];
const EONET_BBOX = `${southWest[1]},${northEast[0]},${northEast[1]},${southWest[0]}`;

const EONET_CATEGORIES = [
  "wildfires",
  "severeStorms",
  "floods",
  "landslides",
  "earthquakes",
];

const EONET_URL = `https://eonet.gsfc.nasa.gov/api/v3/events/geojson?bbox=${EONET_BBOX}&status=open&category=${EONET_CATEGORIES.join(",")}`;

export const GET = async () => {
  try {
    const response = await fetch(EONET_URL, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `EONET request failed (${response.status})` },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[EONET] proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch EONET events" },
      { status: 502 },
    );
  }
};
