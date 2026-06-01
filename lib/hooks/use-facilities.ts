import { useQuery } from "@tanstack/react-query";
import type { FacilitiesData } from "@/lib/facilities/types";

export function useFacilities(lat: number | null, lng: number | null, radius: number) {
  const enabled = lat != null && lng != null;

  return useQuery<FacilitiesData>({
    queryKey: ["facilities", lat, lng, radius],
    queryFn: async () => {
      const res = await fetch(
        `/api/facilities?lat=${lat}&lng=${lng}&radius=${radius}`,
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? `Facilities API error (${res.status})`);
      }
      return res.json();
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}
