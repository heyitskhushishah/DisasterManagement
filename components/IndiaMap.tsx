"use client";

import "leaflet/dist/leaflet.css";

import type { FeatureCollection, Geometry, Position } from "geojson";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

import { EonetEventsLayer } from "@/components/EonetEventsLayer";
import { GdacsEventsLayer } from "@/components/GdacsEventsLayer";
import { GdacsPolygonsLayer } from "@/components/GdacsPolygonsLayer";
import { HistoricalGdacsEventsLayer } from "@/components/HistoricalGdacsEventsLayer";
import {
  INDIA_BOUNDS,
  INDIA_CENTER,
  INDIA_DEFAULT_ZOOM,
  INDIA_MAX_ZOOM,
  INDIA_MIN_ZOOM,
} from "@/lib/map/india-bounds";
import {
  EMPTY_EONET_EVENTS,
  normalizeEonetEvents,
  type EonetFeatureCollection,
} from "@/lib/map/eonet";
import {
  EMPTY_GDACS_EVENTS,
  normalizeGdacsEvents,
  type GdacsEventProperties,
  type GdacsFeatureCollection,
} from "@/lib/map/gdacs";
import {
  EMPTY_GDACS_POLYGONS,
  buildFallbackPolygon,
  type GdacsPolygonCollection,
  type GdacsPolygonFeature,
} from "@/lib/map/gdacs-polygons";

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const FitBoundsOnActivePolygon = ({ polygons }: { polygons: GdacsPolygonCollection }) => {
  const map = useMap();

  useEffect(() => {
    if (polygons.features.length === 0) {
      map.fitBounds(INDIA_BOUNDS, { padding: [20, 20] });
      return;
    }

    const geoLayer = L.geoJSON(polygons as FeatureCollection<Geometry, GdacsEventProperties>);
    const bounds = geoLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [polygons, map]);

  return null;
};

const MapInvalidateOnResize = ({ signal }: { signal: boolean }) => {
  const map = useMap();

  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 0);
    return () => window.clearTimeout(id);
  }, [map, signal]);

  return null;
};

type IndiaMapProps = {
  eonetEvents?: EonetFeatureCollection | null;
  gdacsEvents?: GdacsFeatureCollection | null;
  gdacsPolygons?: GdacsPolygonCollection | null;
  historicalGdacsEvents?: GdacsFeatureCollection | null;
  resizeSignal?: boolean;
};

export const IndiaMap = ({
  eonetEvents: eonetProp,
  gdacsEvents: gdacsProp,
  gdacsPolygons: polygonsProp,
  historicalGdacsEvents: historicalGdacsProp,
  resizeSignal = false,
}: IndiaMapProps) => {
  const eonet = normalizeEonetEvents(eonetProp ?? EMPTY_EONET_EVENTS);
  const gdacs = normalizeGdacsEvents(gdacsProp ?? EMPTY_GDACS_EVENTS);
  const historicalGdacs = normalizeGdacsEvents(
    historicalGdacsProp ?? EMPTY_GDACS_EVENTS,
  );

  const allPolygons = polygonsProp ?? EMPTY_GDACS_POLYGONS;
  const [activeEventId, setActiveEventId] = useState<number | null>(null);

  const polygonByEventId = useMemo(() => {
    const map: Record<number, GdacsPolygonFeature[]> = {};
    for (const f of allPolygons.features) {
      const id = f.properties?.eventid;
      if (id) {
        if (!map[id]) map[id] = [];
        map[id].push(f);
      }
    }
    return map;
  }, [allPolygons]);

  const activePolygons: GdacsPolygonCollection = useMemo(() => {
    if (!activeEventId) return EMPTY_GDACS_POLYGONS;

    const existing = polygonByEventId[activeEventId];
    if (existing && existing.length > 0) {
      return { type: "FeatureCollection", features: existing };
    }

    const event = gdacs.features.find(
      (f) => f.properties?.eventid === activeEventId,
    );
    if (!event) return EMPTY_GDACS_POLYGONS;

    const fallback = buildFallbackPolygon(
      event.properties,
      event.geometry.coordinates as Position,
    );
    return { type: "FeatureCollection", features: [fallback] };
  }, [activeEventId, polygonByEventId, gdacs]);

  const polygonEventIds = useMemo(() => {
    return new Set(
      allPolygons.features
        .filter((f) => !f.properties?.isFallback)
        .map((f) => f.properties?.eventid)
        .filter((id): id is number => id != null),
    );
  }, [allPolygons]);

  const handlePolygonSelect = useCallback((eventId: number | null) => {
    setActiveEventId((prev) => (prev === eventId ? null : eventId));
  }, []);

  if (typeof window === "undefined") {
    return <div className="h-full w-full" />;
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
      center={INDIA_CENTER}
      zoom={INDIA_DEFAULT_ZOOM}
      className="h-full w-full rounded-xl z-0"
      maxBounds={INDIA_BOUNDS}
      maxBoundsViscosity={1}
      minZoom={INDIA_MIN_ZOOM}
      maxZoom={INDIA_MAX_ZOOM}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution={OSM_ATTRIBUTION}
      />
      <MapInvalidateOnResize signal={resizeSignal} />
      <FitBoundsOnActivePolygon polygons={activePolygons} />
      <HistoricalGdacsEventsLayer events={historicalGdacs} />
      <GdacsPolygonsLayer polygons={activePolygons} />
      <EonetEventsLayer events={eonet} />
      <GdacsEventsLayer
        events={gdacs}
        activeEventId={activeEventId}
        polygonEventIds={polygonEventIds}
        onPolygonSelect={handlePolygonSelect}
      />
    </MapContainer>
      {activeEventId && (
        <button
          type="button"
          onClick={() => handlePolygonSelect(null)}
          className="absolute right-3 top-3 z-[10000] rounded-md border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-lg backdrop-blur transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        >
          Clear selection
        </button>
      )}
    </div>
  );
};