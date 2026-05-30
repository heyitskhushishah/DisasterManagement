import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Feature, FeatureCollection } from "geojson";

import {
  GDACS_ALERT_LEVELS,
  GDACS_DEFAULT_START_DATE,
  GDACS_EVENT_TYPES,
  GDACS_MAX_END_DATE,
  GDACS_MAX_RETRIES,
  GDACS_PAGE_SIZE,
  GDACS_REQUEST_DELAY_MS_MAX,
  GDACS_REQUEST_DELAY_MS_MIN,
  GDACS_RETRYABLE_STATUS_CODES,
  GDACS_SEARCH_ENDPOINT,
  GDACS_SOURCE_ATTRIBUTION,
  type GdacsEventListType,
} from "@/lib/gdacs/constants";
import { dedupeGdacsFeatures } from "@/lib/gdacs/dedupeGdacsFeatures";
import { isIndiaGdacsFeature } from "@/lib/gdacs/isIndiaGdacsFeature";

export type FetchGdacsIndiaEventsOptions = {
  startDate?: string;
  endDate?: string;
  outputPath?: string;
};

export type GdacsIndiaFeatureCollection = FeatureCollection & {
  source: string;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const randomRequestDelayMs = (): number =>
  GDACS_REQUEST_DELAY_MS_MIN +
  Math.floor(
    Math.random() *
      (GDACS_REQUEST_DELAY_MS_MAX - GDACS_REQUEST_DELAY_MS_MIN + 1),
  );

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

const resolveEndDate = (endDate?: string): string => {
  const today = todayIsoDate();
  const candidate = endDate ?? today;
  if (candidate > GDACS_MAX_END_DATE) {
    return GDACS_MAX_END_DATE;
  }
  if (candidate > today) {
    return today;
  }
  return candidate;
};

const resolveStartDate = (startDate?: string): string =>
  startDate ?? GDACS_DEFAULT_START_DATE;

const listYearsInRange = (startDate: string, endDate: string): number[] => {
  const startYear = Number.parseInt(startDate.slice(0, 4), 10);
  const endYear = Number.parseInt(endDate.slice(0, 4), 10);
  const years: number[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }

  return years;
};

const getYearDateWindow = (
  year: number,
  startDate: string,
  endDate: string,
): { fromdate: string; todate: string } | null => {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const fromdate = startDate > yearStart ? startDate : yearStart;
  const todate = endDate < yearEnd ? endDate : yearEnd;

  if (fromdate > todate) {
    return null;
  }

  return { fromdate, todate };
};

const buildSearchUrl = (
  eventType: GdacsEventListType,
  fromdate: string,
  todate: string,
  pageNumber: number,
): string => {
  const params = new URLSearchParams({
    eventlist: eventType,
    fromdate,
    todate,
    alertlevel: GDACS_ALERT_LEVELS,
    pagesize: String(GDACS_PAGE_SIZE),
    pagenumber: String(pageNumber),
  });

  return `${GDACS_SEARCH_ENDPOINT}?${params.toString()}`;
};

const isFeatureCollection = (
  value: unknown,
): value is FeatureCollection => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as FeatureCollection;
  return (
    candidate.type === "FeatureCollection" &&
    Array.isArray(candidate.features)
  );
};

const fetchGdacsPage = async (url: string): Promise<Feature[]> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= GDACS_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url);

      if (GDACS_RETRYABLE_STATUS_CODES.has(response.status)) {
        if (attempt < GDACS_MAX_RETRIES) {
          const backoffMs = 2 ** attempt * 1000;
          console.warn(
            `GDACS retryable status ${response.status}; retrying in ${backoffMs}ms (attempt ${attempt + 1}/${GDACS_MAX_RETRIES})`,
          );
          await sleep(backoffMs);
          continue;
        }
        throw new Error(
          `GDACS request failed after retries: ${response.status} ${response.statusText}`,
        );
      }

      if (response.status === 204) {
        return [];
      }

      if (!response.ok) {
        throw new Error(
          `GDACS request failed: ${response.status} ${response.statusText}`,
        );
      }

      const rawBody = await response.text();
      if (!rawBody.trim()) {
        return [];
      }

      const data: unknown = JSON.parse(rawBody);

      if (!isFeatureCollection(data)) {
        throw new Error("GDACS response is not a GeoJSON FeatureCollection");
      }

      return data.features;
    } catch (error) {
      lastError = error;
      if (attempt < GDACS_MAX_RETRIES) {
        const backoffMs = 2 ** attempt * 1000;
        console.warn(
          `GDACS fetch error; retrying in ${backoffMs}ms (attempt ${attempt + 1}/${GDACS_MAX_RETRIES})`,
          error,
        );
        await sleep(backoffMs);
        continue;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("GDACS fetch failed after retries");
};

const fetchEventTypeYearPages = async (
  eventType: GdacsEventListType,
  year: number,
  fromdate: string,
  todate: string,
): Promise<Feature[]> => {
  const collected: Feature[] = [];
  let pageNumber = 1;

  while (true) {
    const url = buildSearchUrl(eventType, fromdate, todate, pageNumber);
    const features = await fetchGdacsPage(url);
    const indiaFeatures = features.filter(isIndiaGdacsFeature);

    console.log(
      `[GDACS] year=${year} event=${eventType} page=${pageNumber} received=${features.length} indiaKept=${indiaFeatures.length}`,
    );

    collected.push(...indiaFeatures);

    if (features.length === 0 || features.length < GDACS_PAGE_SIZE) {
      break;
    }

    pageNumber += 1;
    await sleep(randomRequestDelayMs());
  }

  return collected;
};

/**
 * Fetches GDACS disaster events (2000–present by default), filters to India,
 * deduplicates, and returns a GeoJSON FeatureCollection.
 *
 * Geometry is preserved as returned by GDACS (points, tracks, or other types).
 * Source: Global Disaster Awareness and Coordination System, GDACS.
 */
export const fetchGdacsIndiaEvents = async (
  options: FetchGdacsIndiaEventsOptions = {},
): Promise<GdacsIndiaFeatureCollection> => {
  const startDate = resolveStartDate(options.startDate);
  const endDate = resolveEndDate(options.endDate);

  if (startDate > endDate) {
    throw new Error(
      `startDate (${startDate}) must be on or before endDate (${endDate})`,
    );
  }

  console.log(
    `[GDACS] Fetching India events from ${startDate} to ${endDate}. Source: ${GDACS_SOURCE_ATTRIBUTION}`,
  );

  const allIndiaFeatures: Feature[] = [];

  for (const year of listYearsInRange(startDate, endDate)) {
    const window = getYearDateWindow(year, startDate, endDate);
    if (!window) {
      continue;
    }

    const { fromdate, todate } = window;
    console.log(`[GDACS] year=${year} window=${fromdate}..${todate}`);

    for (const eventType of GDACS_EVENT_TYPES) {
      const yearFeatures = await fetchEventTypeYearPages(
        eventType,
        year,
        fromdate,
        todate,
      );
      allIndiaFeatures.push(...yearFeatures);
      await sleep(randomRequestDelayMs());
    }
  }

  const deduplicatedFeatures = dedupeGdacsFeatures(allIndiaFeatures);

  console.log(
    `[GDACS] India features before dedupe=${allIndiaFeatures.length} after dedupe=${deduplicatedFeatures.length}`,
  );

  const collection: GdacsIndiaFeatureCollection = {
    type: "FeatureCollection",
    features: deduplicatedFeatures,
    source: GDACS_SOURCE_ATTRIBUTION,
  };

  if (options.outputPath) {
    const outputPath = path.resolve(options.outputPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(collection, null, 2)}\n`, "utf8");
    console.log(`[GDACS] Wrote ${deduplicatedFeatures.length} features to ${outputPath}`);
  }

  return collection;
};
