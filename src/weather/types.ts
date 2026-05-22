/**
 * /src/weather/types.ts
 *
 * Shared weather data types used across the application.
 */

export type WeatherCondition =
  | 'clear'
  | 'clouds'
  | 'rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'mist'
  | 'haze'
  | 'unknown';

export interface WeatherData {
  condition: WeatherCondition;
  /** Temperature in Celsius */
  tempC: number;
  /** Humidity percentage 0-100 */
  humidity: number;
  /** Wind speed in km/h */
  windKmh: number;
  /** Short human-readable description */
  description: string;
  /** Emoji icon that represents the condition */
  icon: string;
  /** Cloud coverage percentage 0-100 */
  cloudiness: number;
  /** Visibility in metres */
  visibilityM: number;
}
