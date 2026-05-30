export const GDACS_SEARCH_ENDPOINT =
  "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH";

export const GDACS_EVENT_TYPES = [
  "EQ",
  "TC",
  "TS",
  "FL",
  "VO",
  "DR",
  "WF",
] as const;

export type GdacsEventListType = (typeof GDACS_EVENT_TYPES)[number];

export const GDACS_ALERT_LEVELS = "red;orange;green";

export const GDACS_PAGE_SIZE = 100;

export const GDACS_DEFAULT_START_DATE = "2000-01-01";

export const GDACS_MAX_END_DATE = "2026-12-31";

export const GDACS_SOURCE_ATTRIBUTION =
  "Global Disaster Awareness and Coordination System, GDACS";

export const GDACS_REQUEST_DELAY_MS_MIN = 150;

export const GDACS_REQUEST_DELAY_MS_MAX = 300;

export const GDACS_RETRYABLE_STATUS_CODES = new Set([
  429, 500, 502, 503, 504,
]);

export const GDACS_MAX_RETRIES = 3;
