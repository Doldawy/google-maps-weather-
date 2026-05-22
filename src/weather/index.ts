/**
 * /src/weather/index.ts
 *
 * Weather service — manages periodic polling and notifies subscribers.
 */

import { fetchWeather } from './openweather';
import type { WeatherData } from './types';

export type { WeatherData, WeatherCondition, WeatherEvent, ExtremeWeatherType } from './types';

export type WeatherChangeCallback = (data: WeatherData) => void;

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export class WeatherService {
  private readonly apiKey: string;
  private lat: number;
  private lng: number;
  private readonly intervalMs: number;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private subscribers: WeatherChangeCallback[] = [];
  private lastData: WeatherData | null = null;
  private refreshSeq = 0;

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
    if (this.lastData) cb(this.lastData);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  /** Update the coordinates watched by this service. */
  setLocation(lat: number, lng: number): void {
    this.lat = lat;
    this.lng = lng;

    if (this.refreshTimeoutId !== null) {
      clearTimeout(this.refreshTimeoutId);
    }

    this.refreshTimeoutId = setTimeout(() => {
      void this.refresh(true);
    }, 180);
  }

  /** Start polling for weather data. */
  async start(): Promise<void> {
    await this.refresh(true);
    this.timerId = setInterval(() => void this.refresh(true), this.intervalMs);
  }

  /** Stop polling. */
  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.refreshTimeoutId !== null) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }

  private async refresh(force: boolean): Promise<void> {
    if (
      !force &&
      this.lastData &&
      distanceKm(this.lat, this.lng, this.lastData.coord.lat, this.lastData.coord.lng) < 3
    ) {
      return;
    }

    const seq = ++this.refreshSeq;
    const data = await fetchWeather(this.lat, this.lng, this.apiKey);
    if (!data || seq !== this.refreshSeq) return;

    this.lastData = data;
    for (const cb of this.subscribers) cb(data);
  }
}
