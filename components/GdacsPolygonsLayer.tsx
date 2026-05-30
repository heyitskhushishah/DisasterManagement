"use client";

import type { Feature, Geometry } from "geojson";
import type { Layer } from "leaflet";
import { GeoJSON } from "react-leaflet";

import { buildGdacsPopupHtml } from "@/lib/map/gdacs-popup";
import { getGdacsMarkerStyle } from "@/lib/map/gdacs";
import type { GdacsEventProperties } from "@/lib/map/gdacs";
import {
  type GdacsPolygonCollection,
  type GdacsPolygonEventProperties,
} from "@/lib/map/gdacs-polygons";

type GdacsPolygonsLayerProps = {
  polygons: GdacsPolygonCollection;
};

const FILL_OPACITY = 0.15;
const BORDER_OPACITY = 0.7;

export const GdacsPolygonsLayer = ({
  polygons,
}: GdacsPolygonsLayerProps) => {
  const polygonFeatures = polygons.features ?? [];

  if (polygonFeatures.length === 0) {
    return null;
  }

  const handleEachFeature = (
    feature: Feature<Geometry, GdacsEventProperties>,
    layer: Layer,
  ) => {
    layer.bindPopup(buildGdacsPopupHtml(feature), { maxWidth: 300 });
  };

  const handleStyle = (feature: Feature<Geometry, GdacsPolygonEventProperties> | undefined) => {
    const eventType = feature?.properties?.eventtype ?? "";
    const isFallback = feature?.properties?.isFallback ?? false;
    const { fillColor, color } = getGdacsMarkerStyle(eventType);

    return {
      fillColor,
      color,
      weight: isFallback ? 1 : 2,
      opacity: isFallback ? 0.4 : BORDER_OPACITY,
      fillOpacity: isFallback ? 0.06 : FILL_OPACITY,
      dashArray: isFallback ? "2 6" : "4 6",
    };
  };

  return (
    <GeoJSON
      data={polygons}
      style={handleStyle}
      onEachFeature={handleEachFeature}
    />
  );
};
