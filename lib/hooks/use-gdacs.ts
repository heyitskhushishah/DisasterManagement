import { useQuery } from "@tanstack/react-query";
import type { GdacsFeatureCollection } from "@/lib/map/gdacs";

export function useGdacsEvents() {
  return useQuery<GdacsFeatureCollection>({
    queryKey: ["gdacs"],
    queryFn: async () => {
      const res = await fetch("/api/gdacs/events");
      if (!res.ok) throw new Error(`GDACS API error (${res.status})`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
