/// <reference types="vite/client" />

/**
 * /src/config/index.ts
 *
 * Centralised configuration and environment settings.
 * Replace placeholder values with real API keys before deployment.
 * Use environment variables (VITE_*) so keys are never committed to source control.
 */

export interface AppConfig {
  /** Google Maps JavaScript API key */
  googleMapsApiKey: string;
  /** OpenWeatherMap API key (https://openweathermap.org/api) */
  openWeatherApiKey: string;
  /** Default map centre coordinates */
  defaultCenter: { lat: number; lng: number };
  /** Default map zoom level */
  defaultZoom: number;
  /** How often weather data is refreshed (milliseconds) */
  weatherRefreshIntervalMs: number;
}

export const config: AppConfig = {
  // ─── API Keys ─────────────────────────────────────────────────────────────
  // Set VITE_GOOGLE_MAPS_API_KEY and VITE_OPENWEATHER_API_KEY in a .env file
  // or via Cloudflare Pages environment variables.
  googleMapsApiKey:
    (import.meta.env['VITE_GOOGLE_MAPS_API_KEY'] as string | undefined) ??
    'YOUR_GOOGLE_MAPS_API_KEY_HERE',

  openWeatherApiKey:
    (import.meta.env['VITE_OPENWEATHER_API_KEY'] as string | undefined) ??
    'YOUR_OPENWEATHER_API_KEY_HERE',

  // ─── Map defaults ─────────────────────────────────────────────────────────
  defaultCenter: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  defaultZoom: 14,

  // ─── Refresh interval ─────────────────────────────────────────────────────
  weatherRefreshIntervalMs: 5 * 60 * 1000, // 5 minutes
};
