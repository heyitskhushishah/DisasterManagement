import { useQuery } from "@tanstack/react-query";
import type { WeatherData } from "@/lib/weather/types";

export function useWeather(lat: number | null, lng: number | null) {
  const url =
    lat != null && lng != null
      ? `/api/weather?lat=${lat}&lng=${lng}`
      : "/api/weather";

  return useQuery<WeatherData>({
    queryKey: ["weather", url],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? `Weather API error (${res.status})`);
      }
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}
