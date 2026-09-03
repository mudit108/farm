import "server-only";

// Sandwa, Churu district, Rajasthan — the farm's real location.
const FARM_LAT = 27.75;
const FARM_LON = 74.167;

export type DailyWeather = {
  date: string;
  maxC: number;
  minC: number;
  precipProbability: number;
  weatherCode: number;
  condition: string;
};

export type WeatherData = {
  current: {
    temperatureC: number;
    humidity: number;
    windKph: number;
    precipitationMm: number;
    weatherCode: number;
    condition: string;
  };
  daily: DailyWeather[];
};

// WMO weather codes — https://open-meteo.com/en/docs (see "WMO Weather interpretation codes")
const CONDITIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

function conditionFor(code: number): string {
  return CONDITIONS[code] ?? "—";
}

/**
 * Live weather for the farm's real coordinates, via Open-Meteo — no API
 * key required. Cached for 30 minutes. Returns null on any failure —
 * callers should show an honest "unavailable" state, never fabricate
 * numbers.
 *
 * NOTE: Open-Meteo's key-free tier is licensed for non-commercial use.
 * Mera Khet is a business — if this app is generating real production
 * traffic, check https://open-meteo.com/en/pricing for a commercial
 * plan rather than relying on the free tier indefinitely.
 */
export async function getFarmWeather(): Promise<WeatherData | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${FARM_LAT}&longitude=${FARM_LON}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
      `&timezone=Asia%2FKolkata&forecast_days=5`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      console.error("Open-Meteo request failed:", res.status);
      return null;
    }

    const data = await res.json();

    return {
      current: {
        temperatureC: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        windKph: data.current.wind_speed_10m,
        precipitationMm: data.current.precipitation,
        weatherCode: data.current.weather_code,
        condition: conditionFor(data.current.weather_code),
      },
      daily: (data.daily.time as string[]).map((date, i) => ({
        date,
        maxC: data.daily.temperature_2m_max[i],
        minC: data.daily.temperature_2m_min[i],
        precipProbability: data.daily.precipitation_probability_max[i],
        weatherCode: data.daily.weather_code[i],
        condition: conditionFor(data.daily.weather_code[i]),
      })),
    };
  } catch (err) {
    console.error("getFarmWeather failed:", err);
    return null;
  }
}
