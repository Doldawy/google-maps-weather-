import './style.css'
import { loadGoogleMaps, resolveMapStyles } from './googleMaps'
import type { Coordinates, ExtremeMarker, WeatherLayerData } from './types'
import { fetchWeatherLayer } from './weather'

const DEFAULT_CENTER: Coordinates = { lat: 20, lng: 0 }
const DEFAULT_ZOOM = 3
const REFRESH_DELAY_MS = 1500
const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim()

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root not found.')
}

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Global weather layer</p>
        <h1>Google Maps Weather</h1>
      </div>
      <p class="topbar-copy">Debounced viewport sampling with lightweight 2D overlays and severe-weather markers.</p>
    </header>

    <main class="workspace">
      <section class="map-panel">
        <div id="map" class="map-canvas" aria-label="Google Maps weather view"></div>
        <div id="weatherOverlay" class="weather-overlay clear is-day" aria-hidden="true">
          <div class="sun-glow"></div>
          <div class="cloud-band">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="rain-band">
            <span></span><span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="fog-band"></div>
        </div>
        <div class="map-hud">
          <div class="card status-card">
            <p class="card-label">Viewport weather</p>
            <h2 id="headline">Waiting for the map</h2>
            <p id="subhead">Add your Google Maps API key to begin.</p>
          </div>
          <div class="card metrics-card">
            <dl>
              <div><dt>Debounce</dt><dd>1.5s after map idle</dd></div>
              <div><dt>Cache</dt><dd>5 min nearby reuse</dd></div>
              <div><dt>Samples</dt><dd id="sampleCount">0 viewport points</dd></div>
              <div><dt>Source</dt><dd id="sourceName">Open-Meteo</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <aside class="sidebar">
        <section class="card detail-card">
          <p class="card-label">Current center</p>
          <div class="detail-grid">
            <div><span>Temperature</span><strong id="temperatureValue">--</strong></div>
            <div><span>Rain</span><strong id="rainValue">--</strong></div>
            <div><span>Clouds</span><strong id="cloudValue">--</strong></div>
            <div><span>Visibility</span><strong id="visibilityValue">--</strong></div>
            <div><span>Wind</span><strong id="windValue">--</strong></div>
            <div><span>Mode</span><strong id="modeValue">Day</strong></div>
          </div>
        </section>

        <section class="card detail-card">
          <p class="card-label">Extreme weather markers</p>
          <ul id="markerList" class="marker-list">
            <li>No severe rain or storms in view.</li>
          </ul>
        </section>

        <section class="card detail-card">
          <p class="card-label">Cost-aware behavior</p>
          <ul class="strategy-list">
            <li>World-wide navigation from a single Google map.</li>
            <li>Weather refresh waits until panning or zooming has stopped.</li>
            <li>Recent nearby results are reused before new API calls are made.</li>
            <li>Overlay uses CSS and SVG markers only—no WebGL-heavy rendering.</li>
          </ul>
          <p id="refreshMeta" class="refresh-meta">Awaiting first weather fetch.</p>
        </section>
      </aside>
    </main>
  </div>
`

const mapElement = document.querySelector<HTMLDivElement>('#map')!
const weatherOverlay = document.querySelector<HTMLDivElement>('#weatherOverlay')!
const headline = document.querySelector<HTMLElement>('#headline')!
const subhead = document.querySelector<HTMLElement>('#subhead')!
const sampleCount = document.querySelector<HTMLElement>('#sampleCount')!
const sourceName = document.querySelector<HTMLElement>('#sourceName')!
const temperatureValue = document.querySelector<HTMLElement>('#temperatureValue')!
const rainValue = document.querySelector<HTMLElement>('#rainValue')!
const cloudValue = document.querySelector<HTMLElement>('#cloudValue')!
const visibilityValue = document.querySelector<HTMLElement>('#visibilityValue')!
const windValue = document.querySelector<HTMLElement>('#windValue')!
const modeValue = document.querySelector<HTMLElement>('#modeValue')!
const markerList = document.querySelector<HTMLUListElement>('#markerList')!
const refreshMeta = document.querySelector<HTMLElement>('#refreshMeta')!

let map: google.maps.Map | null = null
let refreshTimer = 0
let refreshRequestId = 0
let activeMarkers: google.maps.Marker[] = []

void bootstrap()

async function bootstrap(): Promise<void> {
  if (!GOOGLE_MAPS_API_KEY) {
    mapElement.classList.add('map-placeholder')
    mapElement.innerHTML = `
      <div class="setup-empty">
        <h2>Missing Google Maps key</h2>
        <p>Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to a local <code>.env</code> file and restart the app.</p>
        <p>The weather layer already targets global coordinates and uses Open-Meteo batching once the map loads.</p>
      </div>
    `
    return
  }

  try {
    const startCenter = await resolveStartCenter()
    const maps = await loadGoogleMaps(GOOGLE_MAPS_API_KEY)

    map = new maps.Map(mapElement, {
      center: startCenter,
      zoom: DEFAULT_ZOOM,
      minZoom: 2,
      maxZoom: 16,
      disableDefaultUI: false,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      gestureHandling: 'greedy',
      styles: resolveMapStyles({
        location: startCenter,
        weatherCode: 0,
        cloudCover: 0,
        precipitation: 0,
        visibility: 10000,
        windSpeed: 0,
        isDay: true,
        temperature: 20,
        kind: 'clear',
        summary: 'Clear sky',
      }),
    })

    map.addListener('dragstart', announceWaiting)
    map.addListener('zoom_changed', announceWaiting)
    map.addListener('idle', scheduleRefresh)

    headline.textContent = 'Map ready'
    subhead.textContent = 'Move the map anywhere in the world to refresh the weather layer.'
    scheduleRefresh()
  } catch (error) {
    console.error(error)
    headline.textContent = 'Map failed to load'
    subhead.textContent = 'Check your Google Maps browser key and network access, then retry.'
    mapElement.classList.add('map-placeholder')
  }
}

function announceWaiting(): void {
  subhead.textContent = 'Map motion detected — weather will refresh shortly after the map settles.'
}

function scheduleRefresh(): void {
  if (!map) {
    return
  }

  if (refreshTimer) {
    window.clearTimeout(refreshTimer)
  }

  subhead.textContent = `Map idle — refreshing weather in ${(REFRESH_DELAY_MS / 1000).toFixed(1)}s.`
  refreshTimer = window.setTimeout(() => {
    void refreshWeather()
  }, REFRESH_DELAY_MS)
}

async function refreshWeather(): Promise<void> {
  if (!map) {
    return
  }

  const center = map.getCenter()
  const bounds = map.getBounds()
  if (!center || !bounds) {
    return
  }

  const requestId = ++refreshRequestId
  headline.textContent = 'Refreshing weather'
  subhead.textContent = 'Sampling the current viewport with a single batched weather request.'

  try {
    const northEast = bounds.getNorthEast()
    const southWest = bounds.getSouthWest()
    const layer = await fetchWeatherLayer(
      { lat: center.lat(), lng: center.lng() },
      {
        north: northEast.lat(),
        east: northEast.lng(),
        south: southWest.lat(),
        west: southWest.lng(),
      },
      map.getZoom() ?? DEFAULT_ZOOM,
    )

    if (requestId !== refreshRequestId) {
      return
    }

    applyLayer(layer)
  } catch (error) {
    console.error(error)
    headline.textContent = 'Weather refresh failed'
    subhead.textContent = 'Unable to reach the weather API right now. Try moving the map again.'
  }
}

function applyLayer(layer: WeatherLayerData): void {
  if (!map) {
    return
  }

  map.setOptions({ styles: resolveMapStyles(layer.center) })
  weatherOverlay.className = `weather-overlay ${layer.center.kind} ${layer.center.isDay ? 'is-day' : 'is-night'}`

  headline.textContent = layer.center.summary
  subhead.textContent = `${formatCoordinates(layer.center.location)} • ${layer.cacheHit ? 'cached nearby result' : 'fresh viewport fetch'}`
  sampleCount.textContent = `${layer.points.length} viewport points`
  sourceName.textContent = layer.source
  temperatureValue.textContent = `${Math.round(layer.center.temperature)}°C`
  rainValue.textContent = `${layer.center.precipitation.toFixed(1)} mm`
  cloudValue.textContent = `${Math.round(layer.center.cloudCover)}%`
  visibilityValue.textContent = formatVisibility(layer.center.visibility)
  windValue.textContent = `${Math.round(layer.center.windSpeed)} km/h`
  modeValue.textContent = layer.center.isDay ? 'Day' : 'Night'
  refreshMeta.textContent = `Last update: ${formatTimestamp(layer.lastUpdated)} • ${layer.markers.length} severe markers in view.`

  renderMarkers(layer.markers)
  renderMarkerList(layer.markers)
}

function renderMarkers(markers: ExtremeMarker[]): void {
  activeMarkers.forEach((marker) => marker.setMap(null))
  activeMarkers = []

  if (!map) {
    return
  }

  activeMarkers = markers.map((marker) => {
    return new google.maps.Marker({
      map,
      position: marker.location,
      title: marker.title,
      zIndex: marker.severity === 'extreme' ? 1000 : 900,
      icon: createMarkerIcon(marker),
    })
  })
}

function renderMarkerList(markers: ExtremeMarker[]): void {
  if (markers.length === 0) {
    markerList.innerHTML = '<li>No severe rain or storms in view.</li>'
    return
  }

  markerList.innerHTML = markers
    .map((marker) => {
      return `<li><strong>${formatMarkerKind(marker.kind)}</strong><span>${marker.title}</span></li>`
    })
    .join('')
}

function createMarkerIcon(marker: ExtremeMarker): google.maps.Icon {
  const palette: Record<ExtremeMarker['severity'], string> = {
    low: '#facc15',
    medium: '#fb923c',
    high: '#ef4444',
    extreme: '#a855f7',
  }
  const sizes: Record<ExtremeMarker['severity'], number> = {
    low: 28,
    medium: 34,
    high: 40,
    extreme: 46,
  }
  const symbol = marker.kind === 'hurricane' ? 'H' : marker.kind === 'storm' ? 'S' : 'R'
  const size = sizes[marker.severity]
  const color = palette[marker.severity]
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="24" fill="${color}" fill-opacity="0.92" />
      <circle cx="32" cy="32" r="28" stroke="${color}" stroke-opacity="0.35" stroke-width="6" />
      <text x="32" y="39" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">${symbol}</text>
    </svg>
  `.trim()

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  }
}

async function resolveStartCenter(): Promise<Coordinates> {
  if (!('geolocation' in navigator)) {
    return DEFAULT_CENTER
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => resolve(DEFAULT_CENTER),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    )
  })
}

function formatCoordinates(location: Coordinates): string {
  return `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatVisibility(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`
}

function formatMarkerKind(kind: ExtremeMarker['kind']): string {
  switch (kind) {
    case 'hurricane':
      return 'Hurricane'
    case 'storm':
      return 'Storm'
    case 'heavy-rain':
      return 'Heavy rain'
    default:
      return 'Weather'
  }
}
