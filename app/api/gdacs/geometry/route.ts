import { NextResponse } from "next/server";

import {
  buildGdacsGeometryUrl,
  extractAffectedAreaPolygons,
  isFeatureCollection,
} from "@/lib/map/gdacs-geometry";

const ALLOWED_EVENT_TYPES = new Set([
  "EQ",
  "TC",
  "TS",
  "FL",
  "VO",
  "DR",
  "WF",
]);

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const eventtype = searchParams.get("eventtype")?.toUpperCase();
  const eventidRaw = searchParams.get("eventid");
  const episodeidRaw = searchParams.get("episodeid");

  if (!eventtype || !ALLOWED_EVENT_TYPES.has(eventtype)) {
    return NextResponse.json(
      { error: "Invalid or missing eventtype" },
      { status: 400 },
    );
  }

  const eventid = Number(eventidRaw);
  const episodeid = Number(episodeidRaw);

  if (!Number.isFinite(eventid) || !Number.isFinite(episodeid)) {
    return NextResponse.json(
      { error: "Invalid or missing eventid / episodeid" },
      { status: 400 },
    );
  }

  const geometryUrl = buildGdacsGeometryUrl(eventtype, eventid, episodeid);

  try {
    const response = await fetch(geometryUrl, {
      next: { revalidate: 86400 },
    });

    if (response.status === 204) {
      return NextResponse.json({
        type: "FeatureCollection",
        features: [],
      });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `GDACS geometry request failed (${response.status})` },
        { status: response.status },
      );
    }

    const rawBody = await response.text();
    if (!rawBody.trim()) {
      return NextResponse.json({
        type: "FeatureCollection",
        features: [],
      });
    }

    const data: unknown = JSON.parse(rawBody);

    if (!isFeatureCollection(data)) {
      return NextResponse.json(
        { error: "GDACS geometry response is not GeoJSON" },
        { status: 502 },
      );
    }

    const affectedAreas = extractAffectedAreaPolygons(data);

    return NextResponse.json(affectedAreas, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("[GDACS] geometry proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GDACS geometry" },
      { status: 502 },
    );
  }
};
