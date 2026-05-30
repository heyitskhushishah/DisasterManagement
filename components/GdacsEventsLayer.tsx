"use client";

import type { Feature, Point } from "geojson";
import L from "leaflet";
import type { Layer } from "leaflet";
import { GeoJSON } from "react-leaflet";

import { buildGdacsPopupHtml } from "@/lib/map/gdacs-popup";
import {
  getGdacsMarkerStyle,
  type GdacsEventProperties,
  type GdacsFeatureCollection,
} from "@/lib/map/gdacs";

type GdacsEventsLayerProps = {
  events: GdacsFeatureCollection;
  activeEventId: number | null;
  polygonEventIds: Set<number>;
  onPolygonSelect: (eventId: number | null) => void;
};

const POINT_RADIUS = 7;

export const GdacsEventsLayer = ({
  events,
  activeEventId,
  polygonEventIds,
  onPolygonSelect,
}: GdacsEventsLayerProps) => {
  if (events.features.length === 0) {
    return null;
  }

  const handleEachFeature = (
    feature: Feature<Point, GdacsEventProperties>,
    layer: Layer,
  ) => {
    layer.bindPopup(buildGdacsPopupHtml(feature), { maxWidth: 300 });

    const eventId = feature.properties?.eventid;
    if (eventId) {
      layer.on({
        click: () => {
          onPolygonSelect(eventId);
        },
      });
    }
  };

  const handlePointToLayer = (
    feature: Feature<Point, GdacsEventProperties>,
    latlng: L.LatLng,
  ) => {
    const eventId = feature.properties?.eventid;
    const isActive = eventId === activeEventId;
    const { fillColor, color } = getGdacsMarkerStyle(
      feature.properties?.eventtype ?? "",
    );

    const hasPolygon = !!eventId && polygonEventIds.has(eventId);
    const options: L.CircleMarkerOptions = {
      radius: isActive ? POINT_RADIUS + 3 : POINT_RADIUS,
      fillColor,
      color,
      weight: isActive ? 3 : 2,
      opacity: 0.9,
      fillOpacity: isActive ? 0.8 : 0.6,
    };
    if (hasPolygon) {
      options.dashArray = "4 4";
    }
    return L.circleMarker(latlng, options);
  };

  return (
    <GeoJSON
      data={events}
      pointToLayer={handlePointToLayer}
      onEachFeature={handleEachFeature}
    />
  );
};
