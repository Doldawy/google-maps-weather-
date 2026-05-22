/**
 * /src/weather/openweather.ts
 *
 * Fetches real-time weather data from the OpenWeatherMap "Current Weather" API.
 * Docs: https://openweathermap.org/current
 */

import type { WeatherCondition, WeatherData } from './types';

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/** Map OpenWeatherMap group IDs to our internal condition tokens. */
function mapConditionId(id: number): WeatherCondition {
  if (id >= 200 && id < 300) return 'thunderstorm';
  if (id >= 300 && id < 400) return 'drizzle';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id === 701 || id === 721 || id === 741) return 'fog';
  if (id === 711 || id === 731 || id === 751 || id === 761 || id === 762)
    return 'haze';
  if (id === 781) return 'thunderstorm';
  if (id === 800) return 'clear';
  if (id > 800) return 'clouds';
  return 'unknown';
}

/** Return an emoji that represents the weather condition. */
function conditionIcon(condition: WeatherCondition): string {
  const map: Record<WeatherCondition, string> = {
    clear: '☀️',
    clouds: '☁️',
    rain: '🌧️',
    drizzle: '🌦️',
    thunderstorm: '⛈️',
    snow: '❄️',
    fog: '🌫️',
    mist: '🌁',
    haze: '🌫️',
    unknown: '🌡️',
  };
  return map[condition];
}

/** Raw shape returned by the OpenWeatherMap API. */
interface OWMResponse {
  weather: Array<{ id: number; description: string }>;
  main: { temp: number; humidity: number };
  wind: { speed: number };
  clouds: { all: number };
  visibility?: number;
}

/**
 * Fetch current weather for the given coordinates.
 *
 * @param lat  Latitude
 * @param lon  Longitude
 * @param apiKey  OpenWeatherMap API key
 * @returns Normalised WeatherData, or null on failure
 */
export async function fetchWeather(
  lat: number,
  lon: number,
  apiKey: string,
): Promise<WeatherData | null> {
  if (apiKey === 'YOUR_OPENWEATHER_API_KEY_HERE') {
    console.warn(
      '[weather] OpenWeather API key not configured — using mock data.',
    );
    return getMockWeather();
  }

  try {
    const url = `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`[weather] API error ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as OWMResponse;
    const weatherEntry = data.weather[0];

    if (!weatherEntry) {
      return null;
    }

    const condition = mapConditionId(weatherEntry.id);

    return {
      condition,
      tempC: Math.round(data.main.temp * 10) / 10,
      humidity: data.main.humidity,
      windKmh: Math.round(data.wind.speed * 3.6 * 10) / 10,
      description:
        weatherEntry.description.charAt(0).toUpperCase() +
        weatherEntry.description.slice(1),
      icon: conditionIcon(condition),
      cloudiness: data.clouds.all,
      visibilityM: data.visibility ?? 10000,
    };
  } catch (err) {
    console.error('[weather] Fetch failed:', err);
    return null;
  }
}

/** Fallback mock data used when no API key is configured. */
function getMockWeather(): WeatherData {
  return {
    condition: 'clouds',
    tempC: 18,
    humidity: 65,
    windKmh: 12,
    description: 'Partly cloudy',
    icon: '⛅',
    cloudiness: 40,
    visibilityM: 10000,
  };
}
