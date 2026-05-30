"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Feature, FeatureCollection, Point } from "geojson";
import L from "leaflet";
import type { Layer } from "leaflet";
import { GeoJSON, useMap } from "react-leaflet";

import { buildGdacsPopupHtml } from "@/lib/map/gdacs-popup";
import { getGdacsAreaPathOptions } from "@/lib/map/gdacs-geometry";
import {
  getGdacsMarkerStyle,
  type GdacsEventProperties,
  type GdacsFeatureCollection,
} from "@/lib/map/gdacs";

const HISTORICAL_POINT_RADIUS = 5;

type HistoricalGdacsEventsLayerProps = {
  events: GdacsFeatureCollection;
};

type AffectedAreaOverlayProps = {
  area: FeatureCollection | null;
  alertlevel: GdacsEventProperties["alertlevel"] | undefined;
};

const AffectedAreaOverlay = ({ area, alertlevel }: AffectedAreaOverlayProps) => {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!area || area.features.length === 0) {
      return;
    }

    const pathOptions = getGdacsAreaPathOptions(alertlevel);
    const layer = L.geoJSON(area, {
      style: () => pathOptions,
    });

    layer.addTo(map);
    layerRef.current = layer;

    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 9 });
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [area, alertlevel, map]);

  return null;
};

export const HistoricalGdacsEventsLayer = ({
  events,
}: HistoricalGdacsEventsLayerProps) => {
  const [affectedArea, setAffectedArea] = useState<FeatureCollection | null>(
    null,
  );
  const [selectedAlert, setSelectedAlert] = useState<
    GdacsEventProperties["alertlevel"] | undefined
  >(undefined);
  const [loadingGeometry, setLoadingGeometry] = useState(false);
  const [geometryError, setGeometryError] = useState<string | null>(null);
  const activeRequestRef = useRef(0);

  const clearAffectedArea = useCallback(() => {
    setAffectedArea(null);
    setSelectedAlert(undefined);
    setGeometryError(null);
  }, []);

  const loadAffectedArea = useCallback(
    async (feature: Feature<Point, GdacsEventProperties>) => {
      const props = feature.properties;
      if (!props) {
        return;
      }

      const requestId = activeRequestRef.current + 1;
      activeRequestRef.current = requestId;
      setLoadingGeometry(true);
      setGeometryError(null);
      setSelectedAlert(props.alertlevel);

      try {
        const params = new URLSearchParams({
          eventtype: props.eventtype,
          eventid: String(props.eventid),
          episodeid: String(props.episodeid),
        });

        const response = await fetch(`/api/gdacs/geometry?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Geometry fetch failed (${response.status})`);
        }

        const data = (await response.json()) as FeatureCollection;

        if (activeRequestRef.current !== requestId) {
          return;
        }

        if (!data.features?.length) {
          setAffectedArea(null);
          setGeometryError("No affected-area polygon available for this event.");
          return;
        }

        setAffectedArea(data);
      } catch {
        if (activeRequestRef.current !== requestId) {
          return;
        }
        setAffectedArea(null);
        setGeometryError("Could not load affected area. Try again later.");
      } finally {
        if (activeRequestRef.current === requestId) {
          setLoadingGeometry(false);
        }
      }
    },
    [],
  );

  if (events.features.length === 0) {
    return null;
  }

  const handleEachFeature = (
    feature: Feature<Point, GdacsEventProperties>,
    layer: Layer,
  ) => {
    const historicalNote =
      '<p class="mt-2 text-xs text-zinc-500">Historical GDACS record. Click marker to show affected area.</p>';
    const popupHtml = `${buildGdacsPopupHtml(feature)}${historicalNote}`;

    layer.bindPopup(popupHtml, { maxWidth: 300 });

    layer.on("click", () => {
      void loadAffectedArea(feature);
    });
  };

  const handlePointToLayer = (
    feature: Feature<Point, GdacsEventProperties>,
    latlng: L.LatLng,
  ) => {
    const { fillColor, color } = getGdacsMarkerStyle(
      feature.properties?.eventtype ?? "",
    );

    return L.circleMarker(latlng, {
      radius: HISTORICAL_POINT_RADIUS,
      fillColor,
      color,
      weight: 1.5,
      opacity: 0.85,
      fillOpacity: 0.35,
      dashArray: "2 2",
    });
  };

  return (
    <>
      <GeoJSON
        key={`historical-gdacs-${events.features.length}`}
        data={events}
        pointToLayer={handlePointToLayer}
        onEachFeature={handleEachFeature}
      />
      <AffectedAreaOverlay area={affectedArea} alertlevel={selectedAlert} />
      {loadingGeometry ? (
        <div
          className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-md bg-white/95 px-2 py-1 text-xs text-zinc-700 shadow dark:bg-zinc-900/95 dark:text-zinc-200"
          role="status"
          aria-live="polite"
        >
          Loading affected area…
        </div>
      ) : null}
      {geometryError ? (
        <div
          className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[14rem] rounded-md bg-white/95 px-2 py-1 text-xs text-amber-800 shadow dark:bg-zinc-900/95 dark:text-amber-200"
          role="status"
          aria-live="polite"
        >
          {geometryError}
          <button
            type="button"
            className="pointer-events-auto ml-2 underline"
            onClick={clearAffectedArea}
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {affectedArea && !loadingGeometry && !geometryError ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-md bg-white/95 px-2 py-1 text-xs text-zinc-700 shadow dark:bg-zinc-900/95 dark:text-zinc-200">
          Showing affected area
          <button
            type="button"
            className="pointer-events-auto ml-2 underline"
            onClick={clearAffectedArea}
          >
            Clear
          </button>
        </div>
      ) : null}
    </>
  );
};
