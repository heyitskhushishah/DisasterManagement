import type { Feature, Point } from "geojson";

import type {
  CategoryBreakdown,
  DashboardLiveEvent,
  DashboardStats,
} from "@/lib/dashboard/types";
import {
  CATEGORY_MARKER_STYLES,
  decodeHtmlEntities,
  getCategoryId,
  type EonetEventProperties,
  type EonetFeatureCollection,
} from "@/lib/map/eonet";
import {
  formatGdacsType,
  type GdacsAlertLevel,
  type GdacsEventProperties,
  type GdacsFeatureCollection,
} from "@/lib/map/gdacs";

const ALERT_RANK: Record<GdacsAlertLevel, number> = {
  Red: 0,
  Orange: 1,
  Green: 2,
};

const CATEGORY_LABELS: Record<string, string> = {
  wildfires: "Wildfires",
  severeStorms: "Severe storms",
  floods: "Floods",
  landslides: "Landslides",
  earthquakes: "Earthquakes",
  unknown: "Other",
};

const gdacsToCategoryId = (eventType: string): string => {
  const map: Record<string, string> = {
    TC: "severeStorms",
    FL: "floods",
    EQ: "earthquakes",
    WF: "wildfires",
  };
  return map[eventType] ?? "unknown";
};

const compareLiveEvents = (a: DashboardLiveEvent, b: DashboardLiveEvent): number => {
  const rankA = a.alertLevel ? ALERT_RANK[a.alertLevel] : 3;
  const rankB = b.alertLevel ? ALERT_RANK[b.alertLevel] : 3;
  if (rankA !== rankB) {
    return rankA - rankB;
  }
  return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
};

const mapGdacsEvent = (
  feature: Feature<Point, GdacsEventProperties>,
): DashboardLiveEvent => {
  const props = feature.properties;
  const id = `gdacs-${props?.eventid ?? props?.episodeid ?? feature.id ?? Math.random()}`;

  return {
    id,
    title: props?.name ?? props?.eventname ?? "Unnamed event",
    typeLabel: formatGdacsType(props?.eventtype ?? ""),
    source: "GDACS",
    alertLevel: props?.alertlevel ?? null,
    severity: props?.severitydata?.severitytext ?? null,
    occurredAt: props?.fromdate ?? props?.datemodified ?? new Date().toISOString(),
    link: props?.url?.report ?? props?.url?.details ?? null,
  };
};

const mapEonetEvent = (
  feature: Feature<Point, EonetEventProperties>,
): DashboardLiveEvent => {
  const props = feature.properties;
  const categoryId = getCategoryId(props);

  return {
    id: `eonet-${props?.id ?? feature.id ?? Math.random()}`,
    title: decodeHtmlEntities(props?.title ?? "Unnamed event"),
    typeLabel: CATEGORY_LABELS[categoryId] ?? "Open event",
    source: "EONET",
    alertLevel: null,
    severity:
      props?.magnitudeValue != null
        ? `${props.magnitudeValue}${props.magnitudeUnit ? ` ${props.magnitudeUnit}` : ""}`
        : null,
    occurredAt: props?.date ?? new Date().toISOString(),
    link: props?.link ?? null,
  };
};

const buildCategoryBreakdown = (
  eonet: EonetFeatureCollection,
  gdacs: GdacsFeatureCollection,
): CategoryBreakdown[] => {
  const counts = new Map<string, number>();

  for (const feature of eonet.features) {
    const id = getCategoryId(feature.properties);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  for (const feature of gdacs.features) {
    const id = gdacsToCategoryId(feature.properties?.eventtype ?? "");
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      label: CATEGORY_LABELS[id] ?? id,
      count,
      color: CATEGORY_MARKER_STYLES[id as keyof typeof CATEGORY_MARKER_STYLES]
        ?.fillColor ?? "#71717a",
    }))
    .sort((a, b) => b.count - a.count);
};

export const computeDashboardStats = (
  eonet: EonetFeatureCollection,
  gdacs: GdacsFeatureCollection,
  historical: GdacsFeatureCollection,
): DashboardStats => {
  const liveEvents: DashboardLiveEvent[] = [
    ...gdacs.features.map(mapGdacsEvent),
    ...eonet.features.map(mapEonetEvent),
  ].sort(compareLiveEvents);

  const redAlertCount = gdacs.features.filter(
    (f) => f.properties?.alertlevel === "Red",
  ).length;
  const orangeAlertCount = gdacs.features.filter(
    (f) => f.properties?.alertlevel === "Orange",
  ).length;
  const highAlertCount = redAlertCount + orangeAlertCount;

  let highestAlert: GdacsAlertLevel | null = null;
  if (redAlertCount > 0) {
    highestAlert = "Red";
  } else if (orangeAlertCount > 0) {
    highestAlert = "Orange";
  } else if (gdacs.features.some((f) => f.properties?.alertlevel === "Green")) {
    highestAlert = "Green";
  }

  return {
    liveEventCount: eonet.features.length + gdacs.features.length,
    eonetCount: eonet.features.length,
    gdacsLiveCount: gdacs.features.length,
    historicalCount: historical.features.length,
    highAlertCount,
    redAlertCount,
    orangeAlertCount,
    highestAlert,
    categoryBreakdown: buildCategoryBreakdown(eonet, gdacs),
    liveEvents,
    lastRefreshed: new Date().toISOString(),
  };
};
