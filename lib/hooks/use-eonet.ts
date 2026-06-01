import { useQuery } from "@tanstack/react-query";
import type { EonetFeatureCollection } from "@/lib/map/eonet";

export function useEonetEvents() {
  return useQuery<EonetFeatureCollection>({
    queryKey: ["eonet"],
    queryFn: async () => {
      const res = await fetch("/api/eonet");
      if (!res.ok) throw new Error(`EONET API error (${res.status})`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
