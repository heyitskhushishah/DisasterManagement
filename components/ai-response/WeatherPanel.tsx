"use client";

import { useMemo } from "react";
import { computeWeatherImpactScore } from "@/lib/weather/impact-score";
import { useWeather } from "@/lib/hooks/use-weather";
import { useDisasterStore } from "@/lib/store/disasterStore";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";

const CONDITION_ICONS: Record<string, string> = {
  thunderstorm: "⛈",
  rain_heavy: "🌧",
  rain: "🌦",
  drizzle: "🌦",
  snow: "🌨",
  mist: "🌫",
  fog: "🌫",
  haze: "🌫",
  dust: "🌪",
  clear: "☀",
  clouds_few: "🌤",
  clouds_scattered: "⛅",
  clouds_broken: "⛅",
  clouds_overcast: "☁",
};

const SCORE_COLORS: Record<string, string> = {
  Low: "text-emerald-400",
  Moderate: "text-amber-400",
  High: "text-orange-400",
  Critical: "text-red-400",
};

const SCORE_BG: Record<string, string> = {
  Low: "bg-emerald-500/10 border-emerald-500/30",
  Moderate: "bg-amber-500/10 border-amber-500/30",
  High: "bg-orange-500/10 border-orange-500/30",
  Critical: "bg-red-500/10 border-red-500/30",
};

export function WeatherPanel() {
  const latitude = useDisasterStore((s) => s.situation.latitude);
  const longitude = useDisasterStore((s) => s.situation.longitude);
  const { data: weather, isLoading: loading, error, refetch } = useWeather(latitude, longitude);

  const impact = useMemo(
    () => (weather?.cities?.length ? computeWeatherImpactScore(weather.cities) : null),
    [weather],
  );

  const worst = useMemo(() => {
    if (!weather?.cities.length) return null;
    return weather.cities.reduce((a, b) => {
      const sa =
        a.temperature +
        a.windSpeed * 2 +
        (100 - a.visibility * 10) +
        (a.condition === "thunderstorm" ? 50 : a.condition === "rain_heavy" ? 30 : 0);
      const sb =
        b.temperature +
        b.windSpeed * 2 +
        (100 - b.visibility * 10) +
        (b.condition === "thunderstorm" ? 50 : b.condition === "rain_heavy" ? 30 : 0);
      return sa > sb ? a : b;
    });
  }, [weather]);

  return (
    <div className="space-y-3">
      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {!loading && !weather && (
        <ErrorDisplay
          message={error?.message ? String(error.message) : "Weather data unavailable."}
          onRetry={() => refetch()}
        />
      )}

      {!loading && weather && impact && (
        <>
          <div
            className={cn(
              "rounded-lg border p-3 text-center",
              SCORE_BG[impact.label],
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Weather Impact Score
            </p>
            <p
              className={cn(
                "mt-1 text-3xl font-bold",
                SCORE_COLORS[impact.label],
              )}
            >
              {impact.score}
              <span className="ml-1.5 text-sm font-medium">/ 100</span>
            </p>
            <span
              className={cn(
                "mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                SCORE_BG[impact.label],
                SCORE_COLORS[impact.label],
              )}
            >
              {impact.label}
            </span>
          </div>

          {worst && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
              <span className="text-2xl">
                {CONDITION_ICONS[worst.condition] ?? "🌡"}
              </span>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-300">{worst.city}</p>
                <p className="text-lg font-bold text-slate-100">
                  {worst.temperature}°C
                </p>
                <p className="text-[11px] text-slate-400">
                  {worst.conditionLabel}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Item
              label="Temperature"
              value={`${Math.max(...weather.cities.map((c) => c.temperature))}°C`}
              sub={`${Math.min(...weather.cities.map((c) => c.temperature))}°C`}
            />
            <Item
              label="Wind"
              value={`${Math.max(...weather.cities.map((c) => c.windSpeed))} km/h`}
              sub="max gust"
            />
            <Item
              label="Visibility"
              value={`${Math.min(...weather.cities.map((c) => c.visibility)).toFixed(1)} km`}
              sub="lowest"
            />
            <Item
              label="Rainfall"
              value={
                weather.cities.some(
                  (c) =>
                    c.condition === "thunderstorm" ||
                    c.condition === "rain_heavy" ||
                    c.condition === "rain",
                )
                  ? "Active"
                  : "None"
              }
              sub={
                weather.cities.filter(
                  (c) =>
                    c.condition === "thunderstorm" ||
                    c.condition === "rain_heavy" ||
                    c.condition === "rain",
                ).length > 0
                  ? `${weather.cities.filter((c) => c.condition === "thunderstorm" || c.condition === "rain_heavy" || c.condition === "rain").length} cities`
                  : ""
              }
            />
          </div>

          {impact.factors.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Score Factors
              </p>
              <div className="space-y-1">
                {impact.factors.map((f) => (
                  <div key={f.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            f.contribution >= 20
                              ? "bg-red-500"
                              : f.contribution >= 10
                                ? "bg-amber-500"
                                : "bg-teal-500",
                          )}
                          style={{ width: `${Math.min((f.contribution / 30) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="w-5 text-right text-slate-500">
                        {f.contribution}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weather.cities.length > 0 && (
            <div className="max-h-[200px] space-y-1 overflow-y-auto pr-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                City Breakdown
              </p>
              {weather.cities.map((c) => (
                <div
                  key={c.city}
                  className="flex items-center gap-2 rounded-md border border-slate-800/40 bg-slate-900/30 px-2.5 py-1.5"
                >
                  <span className="text-base">
                    {CONDITION_ICONS[c.condition] ?? "🌡"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-slate-300 truncate">
                      {c.city}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {c.temperature}°C &middot; {c.windSpeed} km/h
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-medium", getConditionColor(c.condition))}>
                    {c.conditionLabel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Item({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-200">{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

function getConditionColor(condition: string): string {
  switch (condition) {
    case "thunderstorm":
      return "text-purple-400";
    case "rain_heavy":
    case "rain":
    case "drizzle":
      return "text-blue-400";
    case "snow":
      return "text-cyan-300";
    case "fog":
    case "mist":
    case "haze":
      return "text-slate-400";
    case "dust":
      return "text-amber-400";
    case "clear":
      return "text-yellow-400";
    case "clouds_few":
    case "clouds_scattered":
      return "text-slate-300";
    case "clouds_broken":
    case "clouds_overcast":
      return "text-slate-400";
    default:
      return "text-slate-400";
  }
}
