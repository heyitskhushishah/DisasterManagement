export type FacilityType = "hospital" | "police" | "fire_station" | "shelter";

export type Facility = {
  id: string;
  name: string;
  type: FacilityType;
  lat: number;
  lng: number;
  distance: number;
  etaMinutes: number;
  capacity: number | null;
  availability: string;
  phone?: string;
  operator?: string;
};

export type FacilitiesData = {
  facilities: Facility[];
  fetchedAt: number;
  center: { lat: number; lng: number };
  radius: number;
};
