"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import { MapLegend } from "@/components/MapLegend";
import {
  EMPTY_EONET_EVENTS,
  normalizeEonetEvents,
  type EonetFeatureCollection,
} from "@/lib/map/eonet";
import {
  EMPTY_GDACS_EVENTS,
  normalizeGdacsEvents,
  type GdacsFeatureCollection,
} from "@/lib/map/gdacs";
import {
  EMPTY_GDACS_POLYGONS,
  type GdacsPolygonCollection,
} from "@/lib/map/gdacs-polygons";

const IndiaMap = dynamic(
  () => import("@/components/IndiaMap").then((mod) => mod.IndiaMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full animate-pulse rounded-xl bg-slate-800/80"
        aria-hidden
      />
    ),
  },
);

const MaximizeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

const MinimizeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </svg>
);

type IndiaMapCardProps = {
  eonetEvents?: EonetFeatureCollection | null;
  gdacsEvents?: GdacsFeatureCollection | null;
  gdacsPolygons?: GdacsPolygonCollection | null;
  historicalGdacsEvents?: GdacsFeatureCollection | null;
  layout?: "embedded" | "standalone";
};

export const IndiaMapCard = ({
  eonetEvents: eonetProp,
  gdacsEvents: gdacsProp,
  gdacsPolygons: polygonsProp,
  historicalGdacsEvents: historicalGdacsProp,
  layout = "standalone",
}: IndiaMapCardProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const eonet = normalizeEonetEvents(eonetProp ?? EMPTY_EONET_EVENTS);
  const gdacs = normalizeGdacsEvents(gdacsProp ?? EMPTY_GDACS_EVENTS);
  const polygons = polygonsProp ?? EMPTY_GDACS_POLYGONS;
  const historicalGdacs = normalizeGdacsEvents(
    historicalGdacsProp ?? EMPTY_GDACS_EVENTS,
  );
  const liveCount = eonet.features.length + gdacs.features.length;
  const historicalCount = historicalGdacs.features.length;

  const handleToggleMaximize = useCallback(() => {
    setIsMaximized((current) => !current);
  }, []);

  useEffect(() => {
    if (!isMaximized) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMaximized(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMaximized]);

  const embedded = layout === "embedded";
  const sectionClass = isMaximized
    ? "fixed inset-0 z-50 flex flex-col overflow-hidden bg-slate-950 p-4 sm:p-6"
    : embedded
      ? "dashboard-panel flex h-full min-h-[22rem] flex-col rounded-xl border border-slate-800/80 p-4 lg:min-h-[32rem]"
      : "mx-auto mt-6 w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950";

  return (
    <section
      className={sectionClass}
      aria-labelledby="india-map-heading"
    >
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2
            id="india-map-heading"
            className={
              embedded
                ? "text-sm font-semibold text-slate-200"
                : "text-xs font-medium uppercase tracking-wide text-zinc-500"
            }
          >
            Operations map
          </h2>
          <p
            className={
              embedded
                ? "mt-0.5 text-xs text-slate-500"
                : "mt-1 text-sm text-zinc-600 dark:text-zinc-400"
            }
          >
            {liveCount > 0
              ? `${liveCount} open disaster event${liveCount === 1 ? "" : "s"} in the region (NASA EONET + GDACS).`
              : "No open disaster events in the region right now. Data from NASA EONET & GDACS."}
            {historicalCount > 0
              ? ` ${historicalCount} historical GDACS event${historicalCount === 1 ? "" : "s"} (2000–present).`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleMaximize}
          aria-label={isMaximized ? "Restore map size" : "Maximize map"}
          aria-expanded={isMaximized}
          aria-controls="india-map-container"
          className={
            embedded
              ? "shrink-0 rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              : "shrink-0 rounded-lg border border-zinc-300 p-2 text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          }
        >
          {isMaximized ? <MinimizeIcon /> : <MaximizeIcon />}
        </button>
      </div>
      <div
        id="india-map-container"
        className={
          isMaximized
            ? "relative mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-800 [&_.leaflet-container]:rounded-xl"
            : embedded
              ? "relative mt-3 min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-800 [&_.leaflet-container]:rounded-lg"
              : "relative mt-4 h-80 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 [&_.leaflet-container]:rounded-xl"
        }
      >
        <IndiaMap
          eonetEvents={eonet}
          gdacsEvents={gdacs}
          gdacsPolygons={polygons}
          historicalGdacsEvents={historicalGdacs}
          resizeSignal={isMaximized}
        />
      </div>
      <MapLegend
        variant={embedded ? "dark" : "light"}
      />
      <p
        className={
          embedded
            ? "mt-2 shrink-0 text-[11px] text-slate-600"
            : "mt-2 shrink-0 text-xs text-zinc-500 dark:text-zinc-500"
        }
      >
        Solid markers: live events. Dashed markers: historical GDACS (click to
        load affected area). Map panning is limited to India.
        {isMaximized ? " Press Escape to exit fullscreen." : ""}
      </p>
    </section>
  );
};