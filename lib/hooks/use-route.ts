import { useQuery } from "@tanstack/react-query";
import type { RouteData } from "@/lib/routing/types";

type RouteParams = {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
} | null;

export function useRoute(params: RouteParams) {
  return useQuery<RouteData>({
    queryKey: ["route", params],
    queryFn: async () => {
      if (!params) throw new Error("Route parameters required");
      const { fromLat, fromLng, toLat, toLng } = params;
      const res = await fetch(
        `/api/graphhopper?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`,
      );
      if (!res.ok) throw new Error(`Route API error (${res.status})`);
      const data = await res.json();
      return { ...data, from: { lat: fromLat, lng: fromLng }, to: { lat: toLat, lng: toLng } };
    },
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
  });
}
