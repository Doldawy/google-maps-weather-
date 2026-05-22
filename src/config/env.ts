/**
 * config/env.ts
 *
 * Central place for all API keys and environment settings.
 * In production, set these values via environment variables and inject them
 * at build time with Vite's `define` option, or use Cloudflare Pages
 * environment variables exposed through a Worker.
 *
 * IMPORTANT: Never commit real API keys to source control.
 * Replace the placeholder strings below with actual keys locally, or
 * configure them as secrets in your CI / Cloudflare Pages dashboard.
 */

export const config = {
  /**
   * Google Maps JavaScript API key.
   * https://developers.google.com/maps/documentation/javascript/get-api-key
   */
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? 'YOUR_GOOGLE_MAPS_API_KEY',

  /**
   * OpenWeatherMap API key (free tier is sufficient).
   * https://openweathermap.org/appid
   */
  openWeatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY ?? 'YOUR_OPENWEATHER_API_KEY',

  /**
   * Default map centre coordinates (latitude, longitude).
   * Override by calling navigator.geolocation in the app, or set a fixed city.
   */
  defaultCenter: {
    lat: 25.2048, // Dubai – change to your preferred city
    lng: 55.2708,
  },

  /** Initial zoom level (15 is street level, good for driver mode). */
  defaultZoom: 15,

  /** How often to refresh weather data (milliseconds). */
  weatherRefreshIntervalMs: 5 * 60 * 1000, // 5 minutes
} as const;
