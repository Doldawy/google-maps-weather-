export type LayerKind = 'clear' | 'clouds' | 'rain-light' | 'rain-medium' | 'rain-heavy' | 'fog'
export type ExtremeKind = 'storm' | 'hurricane' | 'heavy-rain'
export type Severity = 'low' | 'medium' | 'high' | 'extreme'

export interface Coordinates {
  lat: number
  lng: number
}

export interface ViewportBounds {
  north: number
  east: number
  south: number
  west: number
}

export interface WeatherPoint {
  location: Coordinates
  weatherCode: number
  cloudCover: number
  precipitation: number
  visibility: number
  windSpeed: number
  isDay: boolean
  temperature: number
  kind: LayerKind
  summary: string
}

export interface ExtremeMarker {
  id: string
  location: Coordinates
  kind: ExtremeKind
  severity: Severity
  title: string
}

export interface WeatherLayerData {
  center: WeatherPoint
  points: WeatherPoint[]
  markers: ExtremeMarker[]
  lastUpdated: string
  cacheHit: boolean
  source: string
}
