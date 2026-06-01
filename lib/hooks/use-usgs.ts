import { useQuery } from "@tanstack/react-query";
import type { UsgsFeatureCollection } from "@/lib/map/usgs";

export function useUsgsEvents() {
  return useQuery<UsgsFeatureCollection>({
    queryKey: ["usgs"],
    queryFn: async () => {
      const res = await fetch("/api/usgs/earthquake");
      if (!res.ok) throw new Error(`USGS API error (${res.status})`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
