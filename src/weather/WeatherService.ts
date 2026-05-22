/**
 * weather/WeatherService.ts
 *
 * Fetches real-time weather data from the OpenWeatherMap "Current Weather" API.
 * Docs: https://openweathermap.org/current
 *
 * The service caches the last response and respects a minimum refresh interval
 * so we do not hammer the free-tier API quota.
 */

import { config } from '../config/env';
import type { WeatherCondition, WeatherData } from './types';

/** Raw shape of a successful OpenWeatherMap /weather response (subset). */
interface OWMResponse {
  name: string;
  dt: number;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
  visibility: number;
  clouds: {
    all: number;
  };
}

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

export class WeatherService {
  private cache: WeatherData | null = null;
  private lastFetchAt = 0;

  /**
   * Fetch weather for the given coordinates.
   * Returns cached data if the last fetch was less than `config.weatherRefreshIntervalMs` ago.
   */
  async fetchWeather(lat: number, lng: number): Promise<WeatherData> {
    const now = Date.now();
    if (this.cache && now - this.lastFetchAt < config.weatherRefreshIntervalMs) {
      return this.cache;
    }

    const url =
      `${OWM_BASE}/weather` +
      `?lat=${lat}&lon=${lng}` +
      `&units=metric` +
      `&appid=${config.openWeatherApiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `OpenWeatherMap API error ${response.status}: ${response.statusText}`,
      );
    }

    const raw: OWMResponse = await response.json() as OWMResponse;
    const data = this.parseResponse(raw);

    this.cache = data;
    this.lastFetchAt = now;
    return data;
  }

  /** Force-clear the cache so the next call fetches fresh data. */
  invalidateCache(): void {
    this.cache = null;
    this.lastFetchAt = 0;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private parseResponse(raw: OWMResponse): WeatherData {
    const main = raw.weather[0]?.main ?? 'Unknown';
    return {
      description: raw.weather[0]?.description ?? 'unknown',
      condition: this.mapCondition(main),
      tempC: Math.round(raw.main.temp),
      humidity: raw.main.humidity,
      windSpeed: raw.wind.speed,
      visibilityM: raw.visibility ?? 10000,
      cloudCoverage: raw.clouds.all,
      cityName: raw.name,
      timestamp: raw.dt,
    };
  }

  /**
   * Map the OpenWeatherMap "main" condition group to our internal bucket.
   * Reference: https://openweathermap.org/weather-conditions
   */
  private mapCondition(main: string): WeatherCondition {
    const map: Record<string, WeatherCondition> = {
      Clear: 'clear',
      Clouds: 'clouds',
      Rain: 'rain',
      Drizzle: 'drizzle',
      Mist: 'fog',
      Smoke: 'fog',
      Haze: 'fog',
      Dust: 'fog',
      Fog: 'fog',
      Sand: 'fog',
      Ash: 'fog',
      Squall: 'rain',
      Tornado: 'thunderstorm',
      Snow: 'snow',
      Thunderstorm: 'thunderstorm',
    };
    return map[main] ?? 'unknown';
  }
}
