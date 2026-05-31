"use client";

import type { Feature, Point } from "geojson";
import L from "leaflet";
import type { Layer } from "leaflet";
import { GeoJSON } from "react-leaflet";

import {
  formatUsgsTime,
  getUsgsMarkerColor,
  getUsgsRadius,
  type UsgsEventProperties,
  type UsgsFeatureCollection,
} from "@/lib/map/usgs";

type UsgsEarthquakeLayerProps = {
  events: UsgsFeatureCollection;
};

const escapeHtml = (value: string | number): string =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const buildPopupHtml = (props: UsgsEventProperties): string => {
  const mag = props.mag != null ? props.mag.toFixed(1) : "?";
  const place = escapeHtml(props.place ?? "Unknown location");
  const time = props.time ? formatUsgsTime(props.time) : "—";
  const usgsLink = props.url
    ? `<a href="${escapeHtml(props.url)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">USGS Details</a>`
    : "";

  return `
    <div class="min-w-[10rem] max-w-[14rem] text-sm leading-snug text-zinc-900">
      <p class="text-xs font-medium uppercase tracking-wide text-zinc-500">Earthquake</p>
      <p class="mt-1 font-semibold">M ${escapeHtml(mag)} — ${place}</p>
      <p class="mt-1 text-xs text-zinc-600"><strong>Time:</strong> ${escapeHtml(time)}</p>
      <p class="text-xs text-zinc-600"><strong>Magnitude Type:</strong> ${escapeHtml(props.magType ?? "—")}</p>
      ${props.tsunami ? `<p class="mt-1 text-xs font-semibold text-red-600">⚠ Tsunami risk</p>` : ""}
      ${usgsLink ? `<p class="mt-2 text-xs">${usgsLink}</p>` : ""}
    </div>
  `;
};

export const UsgsEarthquakeLayer = ({ events }: UsgsEarthquakeLayerProps) => {
  if (!events?.features?.length) {
    return null;
  }

  const handleEachFeature = (
    feature: Feature<Point, UsgsEventProperties>,
    layer: Layer,
  ) => {
    layer.bindPopup(buildPopupHtml(feature.properties), { maxWidth: 300 });
  };

  const handlePointToLayer = (
    feature: Feature<Point, UsgsEventProperties>,
    latlng: L.LatLng,
  ) => {
    const mag = feature.properties?.mag ?? 0;
    const color = getUsgsMarkerColor(mag);
    const radius = getUsgsRadius(mag);

    return L.circleMarker(latlng, {
      radius,
      fillColor: color,
      color: "#ffffff",
      weight: 1.5,
      opacity: 0.9,
      fillOpacity: 0.7,
    });
  };

  return (
    <GeoJSON
      data={events}
      pointToLayer={handlePointToLayer}
      onEachFeature={handleEachFeature}
    />
  );
};
