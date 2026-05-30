"use client";

import type { Feature, Geometry, Point } from "geojson";
import L from "leaflet";
import type { Layer } from "leaflet";
import { GeoJSON } from "react-leaflet";

import { buildEonetPopupHtml } from "@/lib/map/eonet-popup";
import {
  getCategoryId,
  getMarkerStyleForCategory,
  type EonetEventProperties,
  type EonetFeatureCollection,
} from "@/lib/map/eonet";

type EonetEventsLayerProps = {
  events: EonetFeatureCollection;
};

const POINT_RADIUS = 7;
const POLYGON_FILL_OPACITY = 0.12;
const POLYGON_BORDER_OPACITY = 0.6;

export const EonetEventsLayer = ({ events }: EonetEventsLayerProps) => {
  if (events.features.length === 0) {
    return null;
  }

  const handleEachFeature = (
    feature: Feature<Geometry, EonetEventProperties>,
    layer: Layer,
  ) => {
    layer.bindPopup(buildEonetPopupHtml(feature), { maxWidth: 280 });
  };

  const handlePointToLayer = (
    feature: Feature<Point, EonetEventProperties>,
    latlng: L.LatLng,
  ) => {
    const categoryId = getCategoryId(feature.properties);
    const { fillColor, color } = getMarkerStyleForCategory(categoryId);

    return L.circleMarker(latlng, {
      radius: POINT_RADIUS,
      fillColor,
      color,
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.85,
    });
  };

  const handleStyle = (feature: Feature<Geometry> | undefined) => {
    if (!feature?.geometry || feature.geometry.type === "Point") return {};

    const categoryId = getCategoryId(
      feature.properties as EonetEventProperties | null,
    );
    const { fillColor, color } = getMarkerStyleForCategory(categoryId);

    return {
      fillColor,
      color,
      weight: 2,
      opacity: POLYGON_BORDER_OPACITY,
      fillOpacity: POLYGON_FILL_OPACITY,
      dashArray: "4 6",
    };
  };

  return (
    <GeoJSON
      data={events}
      pointToLayer={handlePointToLayer}
      style={handleStyle}
      onEachFeature={handleEachFeature}
    />
  );
};
