import { fetchEonetEvents, normalizeEonetEvents } from "@/lib/map/eonet";
import {
  fetchGdacsEvents,
  filterIndiaEvents,
  normalizeGdacsEvents,
} from "@/lib/map/gdacs";
import { loadHistoricalGdacsEvents } from "@/lib/map/load-historical-gdacs";

export const fetchDashboardEvents = async () => {
  const [eonetRaw, gdacsRaw, historicalGdacsEvents] = await Promise.all([
    fetchEonetEvents(),
    fetchGdacsEvents(),
    loadHistoricalGdacsEvents(),
  ]);

  return {
    eonetEvents: normalizeEonetEvents(eonetRaw),
    gdacsEvents: filterIndiaEvents(normalizeGdacsEvents(gdacsRaw)),
    historicalGdacsEvents: normalizeGdacsEvents(historicalGdacsEvents),
  };
};
