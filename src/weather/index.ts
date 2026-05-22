/**
 * /src/weather/index.ts
 *
 * Weather service — manages periodic polling and notifies subscribers.
 */

import { fetchWeather } from './openweather';
import type { WeatherData } from './types';

export type { WeatherData, WeatherCondition } from './types';

export type WeatherChangeCallback = (data: WeatherData) => void;

export class WeatherService {
  private readonly apiKey: string;
  private lat: number;
  private lng: number;
  private readonly intervalMs: number;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private subscribers: WeatherChangeCallback[] = [];
  private lastData: WeatherData | null = null;

  constructor(
    apiKey: string,
    lat: number,
    lng: number,
    intervalMs: number,
  ) {
    this.apiKey = apiKey;
    this.lat = lat;
    this.lng = lng;
    this.intervalMs = intervalMs;
  }

  /** Subscribe to weather updates. Returns an unsubscribe function. */
  subscribe(cb: WeatherChangeCallback): () => void {
    this.subscribers.push(cb);
    // Immediately emit last known data if available
    if (this.lastData) cb(this.lastData);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  /** Update the coordinates watched by this service. */
  setLocation(lat: number, lng: number): void {
    this.lat = lat;
    this.lng = lng;
  }

  /** Start polling for weather data. */
  async start(): Promise<void> {
    await this.refresh();
    this.timerId = setInterval(() => void this.refresh(), this.intervalMs);
  }

  /** Stop polling. */
  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private async refresh(): Promise<void> {
    const data = await fetchWeather(this.lat, this.lng, this.apiKey);
    if (!data) return;
    this.lastData = data;
    for (const cb of this.subscribers) cb(data);
  }
}
