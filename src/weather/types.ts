/**
 * weather/types.ts
 *
 * Shared TypeScript types for weather data throughout the app.
 */

/** Broad weather category used to select visual effects. */
export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'drizzle' | 'fog' | 'snow' | 'thunderstorm' | 'unknown';

export interface WeatherData {
  /** Human-readable description, e.g. "light rain" */
  description: string;
  /** Broad condition bucket */
  condition: WeatherCondition;
  /** Temperature in Celsius */
  tempC: number;
  /** Humidity percentage 0–100 */
  humidity: number;
  /** Wind speed in m/s */
  windSpeed: number;
  /** Visibility in metres */
  visibilityM: number;
  /** Cloud coverage percentage 0–100 */
  cloudCoverage: number;
  /** City name returned by the API */
  cityName: string;
  /** Unix timestamp of the observation */
  timestamp: number;
}
