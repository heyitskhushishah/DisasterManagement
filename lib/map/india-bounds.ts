import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

/** Southwest and northeast corners — restricts panning to India. */
export const INDIA_BOUNDS: LatLngBoundsExpression = [
  [6.5, 68.1],
  [35.7, 97.4],
];

export const INDIA_CENTER: LatLngExpression = [20.5937, 78.9629];

export const INDIA_DEFAULT_ZOOM = 5;

export const INDIA_MIN_ZOOM = 4;
export const INDIA_MAX_ZOOM = 12;
