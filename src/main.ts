/**
 * /src/main.ts
 *
 * Application entry point.
 *
 * Responsibilities:
 *  1. Load configuration
 *  2. Initialise the Google Map
 *  3. Start the WeatherService
 *  4. Boot the EffectsManager
 *  5. Wire UI toggle controls
 *  6. Keep the weather info bar up to date
 */

import { config } from './config';
import { initMap, applyDriverStyle } from './map';
import { WeatherService } from './weather';
import { EffectsManager } from './effects';
import type { WeatherData } from './weather/types';

// ── DOM element references ──────────────────────────────────────────────────

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el as T;
}

const loadingOverlay = getEl<HTMLDivElement>('loading-overlay');

const toggleRain = getEl<HTMLInputElement>('toggle-rain');
const toggleSun = getEl<HTMLInputElement>('toggle-sun');
const toggleFog = getEl<HTMLInputElement>('toggle-fog');
const toggleClouds = getEl<HTMLInputElement>('toggle-clouds');
const toggleDriver = getEl<HTMLInputElement>('toggle-driver');

const weatherIcon = getEl<HTMLSpanElement>('weather-icon');
const weatherDescription = getEl<HTMLSpanElement>('weather-description');
const weatherTemp = getEl<HTMLSpanElement>('weather-temp');
const weatherHumidity = getEl<HTMLSpanElement>('weather-humidity');
const weatherWind = getEl<HTMLSpanElement>('weather-wind');

// ── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  // 1. Initialise Google Map
  const map = await initMap({
    apiKey: config.googleMapsApiKey,
    containerId: 'map',
    center: config.defaultCenter,
    zoom: config.defaultZoom,
    driverModeEnabled: true,
  });

  // 2. Start effects engine
  const effects = new EffectsManager('weather-canvas');
  effects.start();

  // 3. Start weather service
  const weatherSvc = new WeatherService(
    config.openWeatherApiKey,
    config.defaultCenter.lat,
    config.defaultCenter.lng,
    config.weatherRefreshIntervalMs,
  );

  weatherSvc.subscribe((data: WeatherData) => {
    effects.setWeather(data);
    updateWeatherBar(data);
  });

  await weatherSvc.start();

  // 4. Update weather location when the user pans the map
  map.addListener('idle', () => {
    const centre = map.getCenter();
    if (centre) {
      weatherSvc.setLocation(centre.lat(), centre.lng());
    }
  });

  // 5. Wire UI toggles
  toggleRain.addEventListener('change', () =>
    effects.setToggles({ rain: toggleRain.checked }),
  );
  toggleSun.addEventListener('change', () =>
    effects.setToggles({ sun: toggleSun.checked }),
  );
  toggleFog.addEventListener('change', () =>
    effects.setToggles({ fog: toggleFog.checked }),
  );
  toggleClouds.addEventListener('change', () =>
    effects.setToggles({ clouds: toggleClouds.checked }),
  );
  toggleDriver.addEventListener('change', () =>
    applyDriverStyle(map, toggleDriver.checked),
  );

  // 6. Dismiss loading screen
  loadingOverlay.classList.add('hidden');
  setTimeout(() => loadingOverlay.remove(), 700);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function updateWeatherBar(data: WeatherData): void {
  weatherIcon.textContent = data.icon;
  weatherDescription.textContent = data.description;
  weatherTemp.textContent = `${data.tempC}°C`;
  weatherHumidity.textContent = `${data.humidity}%`;
  weatherWind.textContent = `${data.windKmh} km/h`;
}

// ── Run ─────────────────────────────────────────────────────────────────────

bootstrap().catch((err: unknown) => {
  console.error('[main] Bootstrap error:', err);
  loadingOverlay.textContent = '⚠️ Failed to load. Check console for details.';
});
