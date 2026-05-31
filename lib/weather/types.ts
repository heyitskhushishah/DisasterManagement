export type WeatherCondition =
  | "thunderstorm"
  | "rain_heavy"
  | "rain"
  | "drizzle"
  | "snow"
  | "mist"
  | "fog"
  | "haze"
  | "dust"
  | "clear"
  | "clouds_few"
  | "clouds_scattered"
  | "clouds_broken"
  | "clouds_overcast";

export type CityWeather = {
  city: string;
  lat: number;
  lng: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  condition: WeatherCondition;
  conditionLabel: string;
  icon: string;
};

export type WeatherData = {
  cities: CityWeather[];
  fetchedAt: number;
};

export type WeatherImpactScore = {
  score: number;
  label: "Low" | "Moderate" | "High" | "Critical";
  factors: { name: string; contribution: number }[];
};
