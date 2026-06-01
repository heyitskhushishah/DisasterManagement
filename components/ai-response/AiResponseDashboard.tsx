"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { DisasterSituationAnalysis } from "@/components/ai-response/DisasterSituationAnalysis";
import { FacilitiesPanel } from "@/components/ai-response/FacilitiesPanel";
import { AIIntelligencePanel } from "@/components/ai-response/AIIntelligencePanel";
import { DispatchPanel } from "@/components/ai-response/DispatchPanel";
import { ResourceAllocationPanel } from "@/components/ai-response/ResourceAllocationPanel";
import { RoutePlannerPanel } from "@/components/ai-response/RoutePlannerPanel";
import { WeatherPanel } from "@/components/ai-response/WeatherPanel";
import { useDisasterStore } from "@/lib/store/disasterStore";
import { computeWeatherImpactScore } from "@/lib/weather/impact-score";
import { EMPTY_EONET_EVENTS, type EonetFeatureCollection } from "@/lib/map/eonet";
import { EMPTY_GDACS_EVENTS, normalizeGdacsEvents, type GdacsFeatureCollection } from "@/lib/map/gdacs";
import { EMPTY_USGS_EVENTS, formatUsgsTime, type UsgsFeatureCollection } from "@/lib/map/usgs";
import type { DispatchMission } from "@/lib/dispatch/types";
import type { FacilitiesData } from "@/lib/facilities/types";
import type { RouteData, RouteIncidentOption } from "@/lib/routing/types";
import type { WeatherData } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

const AiResponseMap = dynamic(
  () => import("@/components/ai-response/AiResponseMap").then((m) => m.AiResponseMap),
  { ssr: false },
);

type DisplayEvent = {
  id: string;
  type: string;
  label: string;
  detail: string;
  source: "EONET" | "USGS" | "GDACS";
};

const AI_INSIGHTS = [
  { risk: "Cyclone path likely to shift north-east", confidence: "82%", impact: "Chennai, Vizag" },
  { risk: "Aftershock probability within 48h", confidence: "67%", impact: "Guwahati region" },
  { risk: "Flood waters may reach 3 more districts", confidence: "74%", impact: "Bihar central" },
];





const RECOMMENDATIONS = [
  "Deploy 2 additional rescue teams to Patna flood region",
  "Activate emergency broadcast in Chennai coastal areas",
  "Pre-position medical supplies in Guwahati relief camps",
  "Request satellite imagery for Shimla wildfire assessment",
];

const CATEGORY_LABELS: Record<string, string> = {
  wildfires: "Wildfire",
  severeStorms: "Severe Storm",
  floods: "Flood",
  landslides: "Landslide",
  earthquakes: "Earthquake",
};

const SOURCE_COLORS: Record<string, string> = {
  EONET: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  USGS: "text-red-400 border-red-500/30 bg-red-500/10",
  GDACS: "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="dashboard-panel rounded-xl border border-slate-800/60 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-bold tracking-tight ${accent}`}>
        {value}
      </p>
    </div>
  );
}

function PanelCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "dashboard-panel rounded-xl border border-slate-800/60",
        className,
      )}
    >
      <div className="border-b border-slate-800/60 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function AiResponseDashboard() {
  const [eonetEvents, setEonetEvents] = useState<EonetFeatureCollection>(EMPTY_EONET_EVENTS);
  const [usgsEvents, setUsgsEvents] = useState<UsgsFeatureCollection>(EMPTY_USGS_EVENTS);
  const [gdacsEvents, setGdacsEvents] = useState<GdacsFeatureCollection>(EMPTY_GDACS_EVENTS);
  const [loading, setLoading] = useState(true);
  const [showEonet, setShowEonet] = useState(true);
  const [showUsgs, setShowUsgs] = useState(true);
  const [showGdacs, setShowGdacs] = useState(true);
  const [showRadar, setShowRadar] = useState(false);

  const latitude = useDisasterStore((s) => s.situation.latitude);
  const longitude = useDisasterStore((s) => s.situation.longitude);
  const disasterType = useDisasterStore((s) => s.situation.disasterType);
  const severity = useDisasterStore((s) => s.situation.severity);
  const populationAffected = useDisasterStore((s) => s.situation.populationAffected);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<FacilitiesData | null>(null);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);
  const [facilityRadius, setFacilityRadius] = useState(25000);
  const [showFacilities, setShowFacilities] = useState(true);

  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [dispatchMissions, setDispatchMissions] = useState<DispatchMission[]>([]);

  const weatherUrl = useMemo(() => {
    if (latitude != null && longitude != null) {
      return `/api/weather?lat=${latitude}&lng=${longitude}`;
    }
    return "/api/weather";
  }, [latitude, longitude]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eonetRes, usgsRes, gdacsRes, weatherRes] = await Promise.all([
          fetch("/api/eonet"),
          fetch("/api/usgs/earthquake"),
          fetch("/api/gdacs/events"),
          fetch(weatherUrl),
        ]);

        if (eonetRes.ok) {
          const eonet = await eonetRes.json();
          setEonetEvents(eonet);
        }
        if (usgsRes.ok) {
          const usgs = await usgsRes.json();
          setUsgsEvents(usgs);
        }
        if (gdacsRes.ok) {
          const gdacs = await gdacsRes.json();
          setGdacsEvents(normalizeGdacsEvents(gdacs));
        }
        if (weatherRes.ok) {
          const w = await weatherRes.json();
          if (w.cities?.length) setWeather(w);
          setWeatherError(null);
        } else {
          const err = await weatherRes.json().catch(() => ({ error: "Unknown error" }));
          setWeatherError(err.error ?? `Request failed (${weatherRes.status})`);
        }
      } catch {
        console.warn("Failed to fetch live event data");
        setWeatherError("Network error fetching weather");
      } finally {
        setLoading(false);
        setWeatherLoading(false);
      }
    };
    fetchData();
  }, [weatherUrl]);

  const hasFacilityLocation = latitude != null && longitude != null;

  useEffect(() => {
    if (!hasFacilityLocation) return;
    const fetchFacilities = async () => {
      setFacilitiesLoading(true);
      setFacilitiesError(null);
      try {
        const res = await fetch(
          `/api/facilities?lat=${latitude}&lng=${longitude}&radius=${facilityRadius}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.facilities) setFacilities(data);
          setFacilitiesError(null);
        } else {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          setFacilitiesError(err.error ?? `Error ${res.status}`);
        }
      } catch {
        setFacilitiesError("Network error fetching facilities");
      } finally {
        setFacilitiesLoading(false);
      }
    };
    fetchFacilities();
  }, [latitude, longitude, facilityRadius, hasFacilityLocation]);

  const handlePlanRoute = async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    setRouteLoading(true);
    try {
      const res = await fetch(
        `/api/graphhopper?fromLat=${from.lat}&fromLng=${from.lng}&toLat=${to.lat}&toLng=${to.lng}`,
      );
      if (res.ok) {
        const data = await res.json();
        setRouteData({ ...data, from, to });
      }
    } catch {
      console.warn("Route planning failed");
    } finally {
      setRouteLoading(false);
    }
  };

  const displayEvents: DisplayEvent[] = useMemo(() => {
    const events: DisplayEvent[] = [];

    for (const f of eonetEvents.features) {
      const p = f.properties;
      if (!p) continue;
      const catId = p.categories?.[0]?.id ?? "";
      events.push({
        id: p.id,
        type: CATEGORY_LABELS[catId] ?? catId,
        label: p.title,
        detail: p.date ? new Date(p.date).toLocaleString("en-IN") : "—",
        source: "EONET",
      });
    }

    for (const f of usgsEvents.features) {
      const p = f.properties;
      if (!p) continue;
      events.push({
        id: p.code,
        type: `M ${p.mag?.toFixed(1) ?? "?"}`,
        label: p.place ?? "Unknown",
        detail: p.time ? formatUsgsTime(p.time) : "—",
        source: "USGS",
      });
    }

    for (const f of gdacsEvents.features) {
      const p = f.properties;
      if (!p) continue;
      events.push({
        id: String(p.eventid),
        type: p.eventtype ?? "—",
        label: p.eventname ?? p.name ?? "Unknown",
        detail: p.fromdate ? new Date(p.fromdate).toLocaleString("en-IN") : "—",
        source: "GDACS",
      });
    }

    events.sort((a, b) => a.detail.localeCompare(b.detail) * -1);
    return events.slice(0, 20);
  }, [eonetEvents, usgsEvents, gdacsEvents]);

  const totalIncidents = eonetEvents.features.length + usgsEvents.features.length + gdacsEvents.features.length;

  const routeIncidents: RouteIncidentOption[] = useMemo(() => {
    const opts: RouteIncidentOption[] = [];
    for (const f of eonetEvents.features) {
      const p = f.properties;
      const g = f.geometry;
      if (!p || !g) continue;
      opts.push({
        id: `eonet-${p.id}`,
        label: p.title,
        lat: g.coordinates[1],
        lng: g.coordinates[0],
      });
    }
    for (const f of usgsEvents.features) {
      const p = f.properties;
      const g = f.geometry;
      if (!p || !g) continue;
      opts.push({
        id: `usgs-${p.code}`,
        label: p.place ?? "Earthquake",
        lat: g.coordinates[1],
        lng: g.coordinates[0],
      });
    }
    for (const f of gdacsEvents.features) {
      const p = f.properties;
      const g = f.geometry;
      if (!p || !g) continue;
      opts.push({
        id: `gdacs-${p.eventid}`,
        label: p.eventname ?? p.name ?? "GDACS Event",
        lat: g.coordinates[1],
        lng: g.coordinates[0],
      });
    }
    return opts.slice(0, 50);
  }, [eonetEvents, usgsEvents, gdacsEvents]);

  const weatherScore = useMemo(
    () => (weather?.cities?.length ? computeWeatherImpactScore(weather.cities).score : 0),
    [weather],
  );

  return (
    <div className="dashboard-ops-bg flex min-h-screen flex-col">
      <header className="flex-shrink-0 border-b border-slate-800/60 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-500 shadow-lg shadow-teal-500/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-teal-400/90">
                Emergency Operations
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-slate-50">
                AI Disaster Response Platform
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1",
              loading
                ? "bg-amber-500/10 text-amber-300 ring-amber-500/30"
                : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
            )}>
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                loading ? "bg-amber-400" : "bg-emerald-400 animate-pulse",
              )} />
              {loading ? "Loading..." : "System Active"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard
            label="Active Incidents"
            value={String(totalIncidents)}
            accent="text-red-400"
          />
          <StatCard
            label="Active Missions"
            value="12"
            accent="text-teal-400"
          />
          <StatCard
            label="Response Status"
            value={totalIncidents > 10 ? "Critical" : "Stable"}
            accent={totalIncidents > 10 ? "text-amber-400" : "text-emerald-400"}
          />
          <StatCard
            label="Emergency Level"
            value={totalIncidents > 20 ? "Level 3" : totalIncidents > 10 ? "Level 2" : "Level 1"}
            accent={totalIncidents > 20 ? "text-red-400" : totalIncidents > 10 ? "text-orange-400" : "text-teal-400"}
          />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row lg:p-6">
        <aside className="flex flex-col gap-4 lg:w-[30%]">
          <DisasterSituationAnalysis />

          <PanelCard title="Live Events">
            {loading ? (
              <p className="text-sm text-slate-500">Loading events...</p>
            ) : displayEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No active events in the India region.</p>
            ) : (
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {displayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-200">
                        {ev.type}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          SOURCE_COLORS[ev.source],
                        )}
                      >
                        {ev.source}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                      {ev.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {ev.detail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard title="Resource Allocation">
            <ResourceAllocationPanel
              inputs={{
                disasterType,
                severity,
                populationAffected,
                weatherScore,
              }}
            />
          </PanelCard>

          <PanelCard title="AI Intelligence">
            <AIIntelligencePanel
              weather={weather}
              facilities={facilities}
              severity={severity}
              populationAffected={populationAffected}
              disasterType={disasterType}
            />
          </PanelCard>

          <PanelCard title="Dispatch Simulation">
            <DispatchPanel
              incidentLat={latitude}
              incidentLng={longitude}
              incidentLabel={
                displayEvents.length > 0
                  ? displayEvents[0].label
                  : "Selected Location"
              }
              onMissionsChange={setDispatchMissions}
            />
          </PanelCard>
        </aside>

        <section className="flex flex-col lg:w-[50%]">
          <div className="dashboard-panel relative flex-1 overflow-hidden rounded-xl border border-slate-800/60">
            <AiResponseMap
              eonetEvents={eonetEvents}
              gdacsEvents={gdacsEvents}
              usgsEvents={usgsEvents}
              showEonet={showEonet}
              showGdacs={showGdacs}
              showUsgs={showUsgs}
              showRadar={showRadar}
              showFacilities={showFacilities}
              facilitiesData={facilities}
              routeData={routeData}
              dispatchMissions={dispatchMissions}
              onToggleEonet={() => setShowEonet((v) => !v)}
              onToggleGdacs={() => setShowGdacs((v) => !v)}
              onToggleUsgs={() => setShowUsgs((v) => !v)}
              onToggleRadar={() => setShowRadar((v) => !v)}
              onToggleFacilities={() => setShowFacilities((v) => !v)}
            />
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:w-[20%]">
          <PanelCard title="Weather">
            <WeatherPanel weather={weather} loading={weatherLoading} error={weatherError} />
          </PanelCard>

          <PanelCard title="Emergency Facilities">
            <FacilitiesPanel
              data={facilities}
              loading={facilitiesLoading}
              error={facilitiesError}
              radius={facilityRadius}
              onRadiusChange={setFacilityRadius}
              hasLocation={hasFacilityLocation}
            />
          </PanelCard>

          <PanelCard title="Route Planner">
            <RoutePlannerPanel
              incidents={routeIncidents}
              facilities={facilities}
              weatherScore={weatherScore}
              severity={severity}
              routeData={routeData}
              onRouteClear={() => setRouteData(null)}
              loading={routeLoading}
              onPlanRoute={handlePlanRoute}
            />
          </PanelCard>
        </aside>
      </div>
    </div>
  );
}
