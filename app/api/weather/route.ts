import { NextResponse } from "next/server";

import type { CityWeather, WeatherCondition, WeatherData } from "@/lib/weather/types";

const INDIAN_CITIES = [
  { city: "New Delhi", lat: 28.7041, lon: 77.1025 },
  { city: "Mumbai", lat: 19.076, lon: 72.8777 },
  { city: "Chennai", lat: 13.0827, lon: 80.2707 },
  { city: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { city: "Hyderabad", lat: 17.385, lon: 78.4867 },
] as const;

const OWM_CONDITION_MAP: Record<number, string> = {
  200: "thunderstorm",
  201: "thunderstorm",
  202: "thunderstorm",
  210: "thunderstorm",
  211: "thunderstorm",
  212: "thunderstorm",
  221: "thunderstorm",
  230: "thunderstorm",
  231: "thunderstorm",
  232: "thunderstorm",
  300: "drizzle",
  301: "drizzle",
  302: "rain",
  310: "drizzle",
  311: "rain",
  312: "rain",
  313: "rain",
  314: "rain",
  321: "drizzle",
  500: "rain",
  501: "rain",
  502: "rain_heavy",
  503: "rain_heavy",
  504: "rain_heavy",
  511: "snow",
  520: "rain",
  521: "rain",
  522: "rain_heavy",
  531: "rain",
  600: "snow",
  601: "snow",
  602: "snow",
  611: "snow",
  612: "snow",
  613: "snow",
  615: "snow",
  616: "snow",
  620: "snow",
  621: "snow",
  622: "snow",
  701: "mist",
  711: "mist",
  721: "haze",
  731: "dust",
  741: "fog",
  751: "dust",
  761: "dust",
  762: "dust",
  771: "dust",
  781: "thunderstorm",
  800: "clear",
  801: "clouds_few",
  802: "clouds_scattered",
  803: "clouds_broken",
  804: "clouds_overcast",
};

const WEATHER_CONDITION_LABELS: Record<string, string> = {
  thunderstorm: "Thunderstorm",
  rain_heavy: "Heavy Rain",
  rain: "Rain",
  drizzle: "Drizzle",
  snow: "Snow",
  mist: "Mist",
  fog: "Fog",
  haze: "Haze",
  dust: "Dust",
  clear: "Clear Sky",
  clouds_few: "Few Clouds",
  clouds_scattered: "Scattered Clouds",
  clouds_broken: "Broken Clouds",
  clouds_overcast: "Overcast",
};

function mapOwmCondition(id: number): WeatherCondition {
  const mapped = OWM_CONDITION_MAP[id] ?? "clear";
  return mapped as WeatherCondition;
}

async function fetchCity(
  apiKey: string,
  fallbackCity: string,
  lat: number,
  lon: number,
) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  const res = await fetch(url, { next: { revalidate: 600 } });

  if (!res.ok) {
    console.warn(`[Weather] ${fallbackCity} fetch failed (${res.status})`);
    return null;
  }

  const data = await res.json();
  const condId = data.weather?.[0]?.id ?? 800;
  const condition = mapOwmCondition(condId);

  return {
    city: data.name ?? fallbackCity,
    lat,
    lng: lon,
    temperature: Math.round(data.main?.temp ?? 0),
    feelsLike: Math.round(data.main?.feels_like ?? 0),
    humidity: data.main?.humidity ?? 0,
    windSpeed: Math.round((data.wind?.speed ?? 0) * 3.6),
    visibility: (data.visibility ?? 10000) / 1000,
    condition,
    conditionLabel: WEATHER_CONDITION_LABELS[condition] ?? "Unknown",
    icon: data.weather?.[0]?.icon
      ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
      : "",
  };
}

export const GET = async (req: Request) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENWEATHER_API_KEY not configured" },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(req.url);
    const targetLat = searchParams.get("lat");
    const targetLng = searchParams.get("lng");

    let cities: CityWeather[];

    if (targetLat && targetLng) {
      const lat = parseFloat(targetLat);
      const lng = parseFloat(targetLng);
      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
      }
      const result = await fetchCity(apiKey, "Selected Location", lat, lng);
      cities = result ? [result] : [];
    } else {
      const results = await Promise.all(
        INDIAN_CITIES.map(({ city, lat, lon }) => fetchCity(apiKey, city, lat, lon)),
      );
      cities = results.filter(Boolean) as CityWeather[];
    }

    if (cities.length === 0) {
      return NextResponse.json(
        { error: "OpenWeatherMap API returned no data. Check your API key or try again later." },
        { status: 502 },
      );
    }

    const payload: WeatherData = { cities, fetchedAt: Date.now() };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("[Weather] proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 502 },
    );
  }
};
