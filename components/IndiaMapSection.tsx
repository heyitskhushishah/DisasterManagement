import { IndiaMapCard } from "@/components/IndiaMapCard";
import { fetchEonetEvents, normalizeEonetEvents } from "@/lib/map/eonet";
import {
  fetchGdacsEvents,
  filterIndiaEvents,
  normalizeGdacsEvents,
  EMPTY_GDACS_EVENTS,
  type GdacsFeatureCollection,
} from "@/lib/map/gdacs";
import {
  batchFetchGdacsPolygons,
  type GdacsPolygonCollection,
} from "@/lib/map/gdacs-polygons";
import type { EonetFeatureCollection } from "@/lib/map/eonet";

type IndiaMapSectionProps = {
  eonetEvents?: EonetFeatureCollection | null;
  gdacsEvents?: GdacsFeatureCollection | null;
  gdacsPolygons?: GdacsPolygonCollection | null;
  historicalGdacsEvents?: GdacsFeatureCollection | null;
  layout?: "embedded" | "standalone";
};

const fetchDashboardEvents = async () => {
  const [eonetRaw, gdacsRaw] = await Promise.all([
    fetchEonetEvents(),
    fetchGdacsEvents(),
  ]);

  const eonetEvents = normalizeEonetEvents(eonetRaw);
  const gdacsEvents = filterIndiaEvents(normalizeGdacsEvents(gdacsRaw));
  const gdacsPolygons = await batchFetchGdacsPolygons(gdacsEvents);

  return { eonetEvents, gdacsEvents, gdacsPolygons, historicalGdacsEvents: EMPTY_GDACS_EVENTS };
};

export const IndiaMapSection = async ({
  eonetEvents: eonetProp,
  gdacsEvents: gdacsProp,
  gdacsPolygons: polygonsProp,
  historicalGdacsEvents: historicalProp,
  layout = "standalone",
}: IndiaMapSectionProps = {}) => {
  const fetched =
    eonetProp && gdacsProp
      ? {
          eonetEvents: eonetProp,
          gdacsEvents: gdacsProp,
          gdacsPolygons:
            polygonsProp ?? (await batchFetchGdacsPolygons(gdacsProp)),
          historicalGdacsEvents: historicalProp ?? EMPTY_GDACS_EVENTS,
        }
      : await fetchDashboardEvents();

  return (
    <IndiaMapCard
      eonetEvents={fetched.eonetEvents}
      gdacsEvents={fetched.gdacsEvents}
      gdacsPolygons={fetched.gdacsPolygons}
      historicalGdacsEvents={fetched.historicalGdacsEvents}
      layout={layout}
    />
  );
};