import { APIProvider, Map, type MapCameraChangedEvent } from '@vis.gl/react-google-maps'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import './App.css'

type Coordinates = {
  lat: number
  lng: number
}

type WeatherSnapshot = {
  temperature: number
  apparentTemperature: number
  precipitation: number
  cloudCover: number
  humidity: number
  visibility: number
  weatherCode: number
  isDay: boolean
}

type WeatherEffects = {
  sun: boolean
  rain: boolean
  clouds: boolean
  fog: boolean
  summary: string
}

const DEFAULT_CENTER: Coordinates = { lat: 20, lng: 0 }
const DEFAULT_ZOOM = 2
const CLOUDY_CODES = new Set([1, 2, 3])
const FOG_CODES = new Set([45, 48])
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82])
const STORM_CODES = new Set([95, 96, 99])

const CLOUD_POSITIONS = [
  { top: '12%', left: '-10%', width: 180, opacity: 0.34, duration: '34s', delay: '0s' },
  { top: '22%', left: '18%', width: 128, opacity: 0.28, duration: '28s', delay: '-10s' },
  { top: '16%', left: '58%', width: 164, opacity: 0.3, duration: '31s', delay: '-6s' },
  { top: '34%', left: '72%', width: 110, opacity: 0.24, duration: '24s', delay: '-14s' },
]

const RAIN_DROPS = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 17) % 100}%`,
  delay: `${(index % 7) * 0.18}s`,
  duration: `${0.85 + (index % 5) * 0.08}s`,
  opacity: 0.24 + (index % 4) * 0.08,
  height: 68 + (index % 5) * 18,
}))

const FOG_BANDS = [
  { top: '12%', duration: '18s', delay: '0s', opacity: 0.18 },
  { top: '42%', duration: '22s', delay: '-7s', opacity: 0.22 },
  { top: '68%', duration: '20s', delay: '-12s', opacity: 0.16 },
]

function describeWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code === 1) return 'Mostly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (FOG_CODES.has(code)) return 'Fog'
  if (RAIN_CODES.has(code)) return 'Rain showers'
  if (code >= 71 && code <= 77) return 'Snow'
  if (STORM_CODES.has(code)) return 'Thunderstorm'
  return 'Mixed conditions'
}

function inferWeatherEffects(weather: WeatherSnapshot | null): WeatherEffects {
  if (!weather) {
    return {
      sun: false,
      rain: false,
      clouds: false,
      fog: false,
      summary: 'Move the map to load the local weather.'
    }
  }

  const rain = weather.precipitation > 0.1 || RAIN_CODES.has(weather.weatherCode) || STORM_CODES.has(weather.weatherCode)
  const fog = FOG_CODES.has(weather.weatherCode) || weather.visibility < 3500
  const clouds = weather.cloudCover >= 55 || CLOUDY_CODES.has(weather.weatherCode) || rain
  const sun = weather.isDay && !rain && !fog && weather.cloudCover < 60

  return {
    sun,
    rain,
    clouds,
    fog,
    summary: describeWeatherCode(weather.weatherCode),
  }
}

async function fetchWeather(center: Coordinates, signal: AbortSignal): Promise<WeatherSnapshot> {
  const search = new URLSearchParams({
    latitude: center.lat.toFixed(4),
    longitude: center.lng.toFixed(4),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation',
      'cloud_cover',
      'relative_humidity_2m',
      'visibility',
      'weather_code',
      'is_day',
    ].join(','),
    timezone: 'auto',
  })

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${search.toString()}`, { signal })

  if (!response.ok) {
    throw new Error('Unable to load weather data for this map position.')
  }

  const payload = await response.json() as {
    current?: {
      temperature_2m: number
      apparent_temperature: number
      precipitation: number
      cloud_cover: number
      relative_humidity_2m: number
      visibility: number
      weather_code: number
      is_day: number
    }
  }

  if (!payload.current) {
    throw new Error('The weather service did not return current conditions.')
  }

  return {
    temperature: payload.current.temperature_2m,
    apparentTemperature: payload.current.apparent_temperature,
    precipitation: payload.current.precipitation,
    cloudCover: payload.current.cloud_cover,
    humidity: payload.current.relative_humidity_2m,
    visibility: payload.current.visibility,
    weatherCode: payload.current.weather_code,
    isDay: payload.current.is_day === 1,
  }
}

function formatCoordinates(center: Coordinates): string {
  const lat = `${Math.abs(center.lat).toFixed(2)}°${center.lat >= 0 ? 'N' : 'S'}`
  const lng = `${Math.abs(center.lng).toFixed(2)}°${center.lng >= 0 ? 'E' : 'W'}`
  return `${lat}, ${lng}`
}

function WeatherOverlay({ effects }: { effects: WeatherEffects }) {
  return (
    <div className="weather-layer" aria-hidden="true">
      <div className={`sun-glow${effects.sun ? ' active' : ''}`} />

      <div className={`cloud-layer${effects.clouds ? ' active' : ''}`}>
        {CLOUD_POSITIONS.map((cloud) => {
          const style = {
            top: cloud.top,
            left: cloud.left,
            width: `${cloud.width}px`,
            opacity: cloud.opacity,
            animationDuration: cloud.duration,
            animationDelay: cloud.delay,
          } satisfies CSSProperties

          return <span key={`${cloud.top}-${cloud.left}`} className="cloud" style={style} />
        })}
      </div>

      <div className={`rain-layer${effects.rain ? ' active' : ''}`}>
        {RAIN_DROPS.map((drop, index) => {
          const style = {
            left: drop.left,
            animationDelay: drop.delay,
            animationDuration: drop.duration,
            opacity: drop.opacity,
            height: `${drop.height}px`,
          } satisfies CSSProperties

          return <span key={`drop-${index}`} className="rain-drop" style={style} />
        })}
      </div>

      <div className={`fog-layer${effects.fog ? ' active' : ''}`}>
        {FOG_BANDS.map((band) => {
          const style = {
            top: band.top,
            animationDuration: band.duration,
            animationDelay: band.delay,
            opacity: band.opacity,
          } satisfies CSSProperties

          return <span key={band.top} className="fog-band" style={style} />
        })}
      </div>
    </div>
  )
}

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''
  const [mapCenter, setMapCenter] = useState<Coordinates>(DEFAULT_CENTER)
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    fetchWeather(mapCenter, controller.signal)
      .then((nextWeather) => {
        setWeather(nextWeather)
      })
      .catch((nextError: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setError(nextError instanceof Error ? nextError.message : 'Unable to load weather data.')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [mapCenter])

  const weatherEffects = useMemo(() => inferWeatherEffects(weather), [weather])

  const handleCameraChanged = (event: MapCameraChangedEvent) => {
    const nextCenter = event.detail.center
    setMapCenter((currentCenter) => {
      const latChanged = Math.abs(currentCenter.lat - nextCenter.lat) > 0.25
      const lngChanged = Math.abs(currentCenter.lng - nextCenter.lng) > 0.25

      if (!latChanged && !lngChanged) {
        return currentCenter
      }

      return nextCenter
    })
  }

  if (!apiKey) {
    return (
      <main className="setup-screen">
        <section className="setup-card">
          <span className="eyebrow">Google Maps Weather</span>
          <h1>Set your Google Maps API key</h1>
          <p>
            Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to a <code>.env.local</code> file to load the
            global map and weather layer.
          </p>
          <p className="setup-note">
            The weather effects still come from Open-Meteo, but the map itself needs a Google Maps
            browser key.
          </p>
        </section>
      </main>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <main className={`app-shell${weatherEffects.sun ? ' sky-clear' : ''}${weatherEffects.rain ? ' sky-rain' : ''}${weatherEffects.fog ? ' sky-fog' : ''}`}>
        <section className="info-panel">
          <div>
            <span className="eyebrow">Live global weather layer</span>
            <h1>Pan the map to sync local conditions anywhere on Earth.</h1>
            <p>
              The weather overlay follows the map center and updates sun, rain, clouds, and fog as
              you explore different regions.
            </p>
          </div>

          <div className="status-grid">
            <article className="status-card">
              <span>Map center</span>
              <strong>{formatCoordinates(mapCenter)}</strong>
            </article>
            <article className="status-card">
              <span>Conditions</span>
              <strong>{isLoading ? 'Updating…' : weatherEffects.summary}</strong>
            </article>
            <article className="status-card">
              <span>Temperature</span>
              <strong>{weather ? `${Math.round(weather.temperature)}°C` : '—'}</strong>
            </article>
            <article className="status-card">
              <span>Visibility</span>
              <strong>{weather ? `${(weather.visibility / 1000).toFixed(1)} km` : '—'}</strong>
            </article>
          </div>

          <div className="weather-readout" role="status" aria-live="polite">
            {error ? (
              <p>{error}</p>
            ) : (
              <>
                <p>
                  <strong>Feels like:</strong>{' '}
                  {weather ? `${Math.round(weather.apparentTemperature)}°C` : 'Loading…'}
                </p>
                <p>
                  <strong>Cloud cover:</strong> {weather ? `${weather.cloudCover}%` : 'Loading…'}
                </p>
                <p>
                  <strong>Humidity:</strong> {weather ? `${weather.humidity}%` : 'Loading…'}
                </p>
                <p>
                  <strong>Precipitation:</strong>{' '}
                  {weather ? `${weather.precipitation.toFixed(1)} mm` : 'Loading…'}
                </p>
              </>
            )}
          </div>
        </section>

        <section className="map-panel">
          <Map
            reuseMaps
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={DEFAULT_ZOOM}
            minZoom={2}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            clickableIcons={false}
            gestureHandling="greedy"
            disableDefaultUI={false}
            colorScheme="FOLLOW_SYSTEM"
            style={{ width: '100%', height: '100%' }}
            onCameraChanged={handleCameraChanged}
          />
          <WeatherOverlay effects={weatherEffects} />
        </section>
      </main>
    </APIProvider>
  )
}

export default App
