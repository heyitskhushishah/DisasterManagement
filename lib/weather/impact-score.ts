import type { CityWeather, WeatherImpactScore } from "./types";

function conditionWeight(condition: string): number {
  switch (condition) {
    case "thunderstorm":
      return 18;
    case "rain_heavy":
      return 14;
    case "snow":
      return 14;
    case "rain":
      return 10;
    case "drizzle":
      return 5;
    case "fog":
    case "mist":
      return 7;
    case "haze":
    case "dust":
      return 5;
    case "clouds_overcast":
      return 4;
    case "clouds_broken":
      return 3;
    case "clouds_scattered":
      return 2;
    case "clouds_few":
      return 1;
    case "clear":
    default:
      return 0;
  }
}

export function computeWeatherImpactScore(cities: CityWeather[]): WeatherImpactScore {
  if (cities.length === 0) {
    return { score: 0, label: "Low", factors: [] };
  }

  const factors: { name: string; contribution: number }[] = [];

  const maxTemp = Math.max(...cities.map((c) => c.temperature));
  const maxWind = Math.max(...cities.map((c) => c.windSpeed));
  const minVis = Math.min(...cities.map((c) => c.visibility));
  const maxHum = Math.max(...cities.map((c) => c.humidity));
  const worstCondition = cities.reduce((worst, c) => {
    const w = conditionWeight(c.condition);
    const cur = conditionWeight(worst.condition);
    return w > cur ? c : worst;
  }, cities[0]);

  let total = 0;

  const tempDeviation = Math.abs(maxTemp - 22);
  const tempContrib = Math.min(Math.round(tempDeviation * 1.5), 30);
  if (tempContrib > 0) {
    const label =
      maxTemp >= 40
        ? "Extreme heat"
        : maxTemp >= 35
          ? "Very hot"
          : maxTemp >= 30
            ? "Hot"
            : maxTemp <= 5
              ? "Freezing"
              : maxTemp <= 12
                ? "Cold"
                : maxTemp <= 18
                  ? "Cool"
                  : "Temperature deviation";
    factors.push({ name: label, contribution: tempContrib });
    total += tempContrib;
  }

  const windContrib = Math.min(Math.round(maxWind * 0.35), 24);
  if (windContrib > 0) {
    const label =
      maxWind >= 80
        ? "Extreme wind"
        : maxWind >= 60
          ? "Very windy"
          : maxWind >= 40
            ? "Windy"
            : maxWind >= 25
              ? "Breezy"
              : "Light wind";
    factors.push({ name: label, contribution: windContrib });
    total += windContrib;
  }

  const visContrib = Math.min(Math.round((10 - Math.min(minVis, 10)) * 2), 20);
  if (visContrib > 0) {
    const label = minVis < 1 ? "Very low visibility" : minVis < 3 ? "Low visibility" : "Reduced visibility";
    factors.push({ name: label, contribution: visContrib });
    total += visContrib;
  }

  const humContrib = Math.min(Math.round(Math.max(0, maxHum - 40) * 0.3), 15);
  if (humContrib > 0) {
    factors.push({ name: maxHum >= 90 ? "Extreme humidity" : "Elevated humidity", contribution: humContrib });
    total += humContrib;
  }

  const weight = conditionWeight(worstCondition.condition);
  if (weight > 0) {
    factors.push({
      name: worstCondition.conditionLabel,
      contribution: weight,
    });
    total += weight;
  }

  const score = Math.min(total, 100);

  let label: WeatherImpactScore["label"] = "Low";
  if (score >= 70) label = "Critical";
  else if (score >= 50) label = "High";
  else if (score >= 30) label = "Moderate";

  return { score, label, factors };
}
