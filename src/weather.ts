import type { Coordinates, ExtremeKind, ExtremeMarker, LayerKind, Severity, ViewportBounds, WeatherLayerData, WeatherPoint } from './types'

const API_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE = new Map<string, { expiresAt: number; value: WeatherLayerData }>()

const LIGHT_RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 80])
const MEDIUM_RAIN_CODES = new Set([63, 66, 81])
const HEAVY_RAIN_CODES = new Set([65, 67, 82])
const STORM_CODES = new Set([95, 96, 99])
const FOG_CODES = new Set([45, 48])
const CLOUD_CODES = new Set([1, 2, 3])

interface ApiCurrentWeather {
  weather_code: number
  cloud_cover: number
  precipitation: number
  visibility: number
  wind_speed_10m: number
  is_day: number
  temperature_2m: number
  time: string
}

interface ApiWeatherResponse {
  latitude: number
  longitude: number
  current: ApiCurrentWeather
}

export async function fetchWeatherLayer(
  center: Coordinates,
  bounds: ViewportBounds,
  zoom: number,
): Promise<WeatherLayerData> {
  const samplePoints = buildSamplePoints(center, bounds, zoom)
  const cacheKey = createCacheKey(center, zoom, samplePoints.length)
  const cached = CACHE.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.value, cacheHit: true }
  }

  const query = new URLSearchParams({
    latitude: samplePoints.map((point) => point.lat.toFixed(4)).join(','),
    longitude: samplePoints.map((point) => point.lng.toFixed(4)).join(','),
    current: 'weather_code,cloud_cover,precipitation,visibility,wind_speed_10m,is_day,temperature_2m',
    timezone: 'auto',
    forecast_days: '1',
  })

  const response = await fetch(`${API_ENDPOINT}?${query.toString()}`)
  if (!response.ok) {
    throw new Error(`Weather request failed with ${response.status}`)
  }

  const rawPayload = (await response.json()) as ApiWeatherResponse | ApiWeatherResponse[]
  const payload = Array.isArray(rawPayload) ? rawPayload : [rawPayload]

  const points = payload.map((entry, index) => toWeatherPoint(entry, samplePoints[index]))
  const markers = buildExtremeMarkers(points)
  const centerPoint = pickClosestPoint(points, center)
  const layer: WeatherLayerData = {
    center: centerPoint,
    points,
    markers,
    lastUpdated: centerPoint.currentTime ?? new Date().toISOString(),
    cacheHit: false,
    source: 'Open-Meteo current weather',
  }

  CACHE.set(cacheKey, {
    value: layer,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })

  return layer
}

function buildSamplePoints(center: Coordinates, bounds: ViewportBounds, zoom: number): Coordinates[] {
  const latSpan = Math.max(Math.abs(bounds.north - bounds.south), zoom <= 3 ? 24 : 2)
  const lngSpan = Math.max(longitudeSpan(bounds.west, bounds.east), zoom <= 3 ? 24 : 2)
  const latSteps = zoom <= 3 ? [0.2, 0.5, 0.8] : [0.15, 0.5, 0.85]
  const lngSteps = zoom <= 3 ? [0.2, 0.5, 0.8] : [0.18, 0.5, 0.82]
  const west = normalizeLongitude(bounds.west)
  const points: Coordinates[] = []

  for (const latStep of latSteps) {
    for (const lngStep of lngSteps) {
      const lat = clamp(bounds.south + latSpan * latStep, -85, 85)
      const lng = normalizeLongitude(west + lngSpan * lngStep)
      points.push({ lat, lng })
    }
  }

  points.push(center)
  return dedupePoints(points)
}

function dedupePoints(points: Coordinates[]): Coordinates[] {
  const seen = new Set<string>()
  return points.filter((point) => {
    const key = `${point.lat.toFixed(2)}:${point.lng.toFixed(2)}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function toWeatherPoint(entry: ApiWeatherResponse, fallbackLocation: Coordinates | undefined): WeatherPoint & { currentTime?: string } {
  const location = fallbackLocation ?? { lat: entry.latitude, lng: entry.longitude }
  const current = entry.current
  const kind = deriveLayerKind(current.weather_code, current.cloud_cover, current.precipitation, current.visibility)

  return {
    location,
    weatherCode: current.weather_code,
    cloudCover: current.cloud_cover,
    precipitation: current.precipitation,
    visibility: current.visibility,
    windSpeed: current.wind_speed_10m,
    isDay: current.is_day === 1,
    temperature: current.temperature_2m,
    kind,
    summary: summarizeWeather(kind, current.weather_code),
    currentTime: current.time,
  }
}

function deriveLayerKind(
  weatherCode: number,
  cloudCover: number,
  precipitation: number,
  visibility: number,
): LayerKind {
  if (visibility <= 1000 || FOG_CODES.has(weatherCode)) {
    return 'fog'
  }

  if (HEAVY_RAIN_CODES.has(weatherCode) || precipitation >= 7) {
    return 'rain-heavy'
  }

  if (MEDIUM_RAIN_CODES.has(weatherCode) || precipitation >= 2.5) {
    return 'rain-medium'
  }

  if (LIGHT_RAIN_CODES.has(weatherCode) || precipitation > 0.1) {
    return 'rain-light'
  }

  if (cloudCover >= 55 || CLOUD_CODES.has(weatherCode)) {
    return 'clouds'
  }

  return 'clear'
}

function summarizeWeather(kind: LayerKind, weatherCode: number): string {
  if (STORM_CODES.has(weatherCode)) {
    return 'Thunderstorm activity'
  }

  switch (kind) {
    case 'clear':
      return 'Clear sky'
    case 'clouds':
      return 'Clouds / overcast'
    case 'rain-light':
      return 'Light rain'
    case 'rain-medium':
      return 'Moderate rain'
    case 'rain-heavy':
      return 'Heavy rain'
    case 'fog':
      return 'Fog / low visibility'
    default:
      return 'Mixed weather'
  }
}

function buildExtremeMarkers(points: WeatherPoint[]): ExtremeMarker[] {
  return points.flatMap((point, index) => {
    const alert = classifyExtreme(point)
    if (!alert) {
      return []
    }

    return [
      {
        id: `${alert.kind}-${index}-${point.location.lat.toFixed(2)}-${point.location.lng.toFixed(2)}`,
        location: point.location,
        kind: alert.kind,
        severity: alert.severity,
        title: `${point.summary} • ${Math.round(point.windSpeed)} km/h wind • ${point.precipitation.toFixed(1)} mm`,
      },
    ]
  })
}

function classifyExtreme(point: WeatherPoint): { kind: ExtremeKind; severity: Severity } | null {
  if (point.windSpeed >= 118) {
    return { kind: 'hurricane', severity: point.windSpeed >= 145 ? 'extreme' : 'high' }
  }

  if (STORM_CODES.has(point.weatherCode) || point.windSpeed >= 75) {
    return { kind: 'storm', severity: point.windSpeed >= 100 ? 'high' : 'medium' }
  }

  if (point.precipitation >= 10 || point.kind === 'rain-heavy') {
    return { kind: 'heavy-rain', severity: point.precipitation >= 18 ? 'high' : 'medium' }
  }

  return null
}

function pickClosestPoint(points: WeatherPoint[], center: Coordinates): WeatherPoint & { currentTime?: string } {
  return points.reduce((closest, point) => {
    const closestDistance = distanceBetween(closest.location, center)
    const pointDistance = distanceBetween(point.location, center)
    return pointDistance < closestDistance ? point : closest
  }) as WeatherPoint & { currentTime?: string }
}

function createCacheKey(center: Coordinates, zoom: number, sampleCount: number): string {
  const bucket = zoom <= 3 ? 1.5 : zoom <= 6 ? 0.75 : zoom <= 9 ? 0.35 : 0.15
  const lat = Math.round(center.lat / bucket) * bucket
  const lng = Math.round(normalizeLongitude(center.lng) / bucket) * bucket
  return `${zoom}:${sampleCount}:${lat.toFixed(2)}:${lng.toFixed(2)}`
}

function longitudeSpan(west: number, east: number): number {
  const normalizedWest = normalizeLongitude(west)
  const normalizedEast = normalizeLongitude(east)
  const raw = normalizedEast - normalizedWest
  return raw >= 0 ? raw : raw + 360
}

function normalizeLongitude(longitude: number): number {
  const normalized = ((longitude + 180) % 360 + 360) % 360 - 180
  return normalized === -180 ? 180 : normalized
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function distanceBetween(a: Coordinates, b: Coordinates): number {
  return Math.hypot(a.lat - b.lat, normalizeLongitude(a.lng - b.lng))
}
