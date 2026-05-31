import { create } from "zustand";

export type DisasterType = "Flood" | "Fire" | "Earthquake" | "Cyclone" | "Landslide";

export interface DisasterSituation {
  disasterType: DisasterType | "";
  severity: number;
  populationAffected: number;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

interface DisasterStore {
  situation: DisasterSituation;
  setDisasterType: (type: DisasterType | "") => void;
  setSeverity: (value: number) => void;
  setPopulationAffected: (value: number) => void;
  setDescription: (text: string) => void;
  setCoordinates: (lat: number, lng: number) => void;
  reset: () => void;
}

const INITIAL: DisasterSituation = {
  disasterType: "",
  severity: 5,
  populationAffected: 0,
  description: "",
  latitude: null,
  longitude: null,
};

export const useDisasterStore = create<DisasterStore>((set) => ({
  situation: { ...INITIAL },
  setDisasterType: (disasterType) =>
    set((state) => ({ situation: { ...state.situation, disasterType } })),
  setSeverity: (severity) =>
    set((state) => ({ situation: { ...state.situation, severity } })),
  setPopulationAffected: (populationAffected) =>
    set((state) => ({ situation: { ...state.situation, populationAffected } })),
  setDescription: (description) =>
    set((state) => ({ situation: { ...state.situation, description } })),
  setCoordinates: (latitude, longitude) =>
    set((state) => ({ situation: { ...state.situation, latitude, longitude } })),
  reset: () => set({ situation: { ...INITIAL } }),
}));
