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

export type ExtremeWeatherType =
  | 'hurricane'
  | 'cyclone'
  | 'tropical-storm'
  | 'heavy-rain-cell'
  | 'wind-pattern';

export type RotationDirection = 'clockwise' | 'counterclockwise';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface WeatherEvent {
  id: string;
  type: ExtremeWeatherType;
  position: Coordinates;
  strength: number;
  strengthLabel: string;
  rotationDirection: RotationDirection;
  sizeKm: number;
  windKmh: number;
  pressureHpa: number;
  description: string;
}

export interface WeatherData {
  condition: WeatherCondition;
  /** Temperature in Celsius */
  tempC: number;
  /** Humidity percentage 0-100 */
  humidity: number;
  /** Wind speed in km/h */
  windKmh: number;
  /** Wind direction in degrees */
  windDeg: number;
  /** Peak gust speed in km/h */
  gustKmh: number;
  /** Pressure in hPa */
  pressureHpa: number;
  /** Hourly precipitation estimate in mm */
  precipitationMm: number;
  /** Short human-readable description */
  description: string;
  /** Emoji icon that represents the condition */
  icon: string;
  /** Cloud coverage percentage 0-100 */
  cloudiness: number;
  /** Visibility in metres */
  visibilityM: number;
  /** Approximate local time at the weather point */
  localTimeMs: number;
  /** Sunrise time at the weather point */
  sunriseMs: number;
  /** Sunset time at the weather point */
  sunsetMs: number;
  /** Whether the location is currently in daytime */
  isDay: boolean;
  /** Location currently represented by the map centre */
  coord: Coordinates;
  /** Place name from the weather provider */
  locationName: string;
  /** Extreme systems near the map centre */
  extremeEvents: WeatherEvent[];
}
