import type { WeatherPoint } from './types'

type GoogleGlobal = typeof globalThis & {
  google?: typeof google
  [key: string]: unknown
}

let mapsLoader: Promise<typeof google.maps> | null = null

const DAY_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#eff6ff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#304a6c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f7fbff' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c9d5ea' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#dff2dd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#d3e5ff' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#7dd3fc' }] },
]

const NIGHT_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#dbeafe' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#020617' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#13293d' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#13293d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b3b60' }] },
]

const CLOUD_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ saturation: -20 }, { lightness: 4 }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c7d2df' }] },
]

const STORM_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ saturation: -35 }, { lightness: -8 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1d4ed8' }] },
]

const FOG_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ saturation: -60 }, { lightness: 18 }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
]

export function loadGoogleMaps(apiKey: string): Promise<typeof google.maps> {
  const googleGlobal = globalThis as GoogleGlobal

  if (typeof googleGlobal.google?.maps !== 'undefined') {
    return Promise.resolve(googleGlobal.google.maps)
  }

  if (mapsLoader) {
    return mapsLoader
  }

  mapsLoader = new Promise((resolve, reject) => {
    const callbackName = '__googleMapsWeatherInit'
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="true"]')

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (googleGlobal.google?.maps) {
          resolve(googleGlobal.google.maps)
          return
        }

        reject(new Error('Google Maps failed to load.'))
      }, { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load.')), {
        once: true,
      })
      return
    }

    googleGlobal[callbackName] = () => {
      if (googleGlobal.google?.maps) {
        resolve(googleGlobal.google.maps)
      } else {
        reject(new Error('Google Maps failed to load.'))
      }

      delete googleGlobal[callbackName]
    }

    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.dataset.googleMapsLoader = 'true'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&callback=${callbackName}`
    script.onerror = () => reject(new Error('Google Maps failed to load.'))
    document.head.append(script)
  })

  return mapsLoader
}

export function resolveMapStyles(point: WeatherPoint): google.maps.MapTypeStyle[] {
  const base = point.isDay ? DAY_STYLES : NIGHT_STYLES

  if (point.kind === 'fog') {
    return [...base, ...FOG_STYLES]
  }

  if (point.kind === 'rain-medium' || point.kind === 'rain-heavy') {
    return [...base, ...STORM_STYLES]
  }

  if (point.kind === 'clouds') {
    return [...base, ...CLOUD_STYLES]
  }

  return base
}
