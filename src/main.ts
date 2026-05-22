/**
 * /src/main.ts
 *
 * Application entry point.
 */

import { config } from './config';
import { GlobalWeatherLayer, applyDriverStyle, initMap } from './map';
import { EffectsManager } from './effects';
import { WeatherService } from './weather';
import type { WeatherData, WeatherEvent } from './weather/types';

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
const toggleWind = getEl<HTMLInputElement>('toggle-wind');
const toggleSystems = getEl<HTMLInputElement>('toggle-systems');
const toggleDriver = getEl<HTMLInputElement>('toggle-driver');

const weatherIcon = getEl<HTMLSpanElement>('weather-icon');
const weatherDescription = getEl<HTMLSpanElement>('weather-description');
const weatherTemp = getEl<HTMLSpanElement>('weather-temp');
const weatherHumidity = getEl<HTMLSpanElement>('weather-humidity');
const weatherWind = getEl<HTMLSpanElement>('weather-wind');
const weatherLocation = getEl<HTMLSpanElement>('weather-location');
const weatherCoords = getEl<HTMLSpanElement>('weather-coords');
const weatherVisibility = getEl<HTMLSpanElement>('weather-visibility');
const weatherSystem = getEl<HTMLSpanElement>('weather-system');

async function bootstrap(): Promise<void> {
  const map = await initMap({
    apiKey: config.googleMapsApiKey,
    containerId: 'map',
    center: config.defaultCenter,
    zoom: config.defaultZoom,
    driverModeEnabled: true,
  });

  const effects = new EffectsManager('weather-canvas');
  effects.start();

  const globalLayer = new GlobalWeatherLayer(map, config.openWeatherApiKey);
  const weatherSvc = new WeatherService(
    config.openWeatherApiKey,
    config.defaultCenter.lat,
    config.defaultCenter.lng,
    config.weatherRefreshIntervalMs,
  );

  weatherSvc.subscribe((data: WeatherData) => {
    effects.setWeather(data);
    globalLayer.setWeather(data);
    updateWeatherBar(data);
  });

  await weatherSvc.start();

  map.addListener('idle', () => {
    const center = map.getCenter();
    if (!center) return;
    weatherSvc.setLocation(center.lat(), center.lng());
  });

  toggleRain.addEventListener('change', () => {
    effects.setToggles({ rain: toggleRain.checked });
    globalLayer.setToggles({ rain: toggleRain.checked });
  });
  toggleSun.addEventListener('change', () =>
    effects.setToggles({ sun: toggleSun.checked }),
  );
  toggleFog.addEventListener('change', () =>
    effects.setToggles({ fog: toggleFog.checked }),
  );
  toggleClouds.addEventListener('change', () => {
    effects.setToggles({ clouds: toggleClouds.checked });
    globalLayer.setToggles({ clouds: toggleClouds.checked });
  });
  toggleWind.addEventListener('change', () =>
    globalLayer.setToggles({ wind: toggleWind.checked }),
  );
  toggleSystems.addEventListener('change', () =>
    globalLayer.setToggles({ extreme: toggleSystems.checked }),
  );
  toggleDriver.addEventListener('change', () =>
    applyDriverStyle(map, toggleDriver.checked),
  );

  loadingOverlay.classList.add('hidden');
  setTimeout(() => loadingOverlay.remove(), 700);
}

function updateWeatherBar(data: WeatherData): void {
  weatherIcon.textContent = data.icon;
  weatherDescription.textContent = data.description;
  weatherTemp.textContent = `${data.tempC}°C`;
  weatherHumidity.textContent = `${data.humidity}%`;
  weatherWind.textContent = `${Math.round(data.windKmh)} km/h`;
  weatherLocation.textContent = data.locationName;
  weatherCoords.textContent = `${data.coord.lat.toFixed(2)}, ${data.coord.lng.toFixed(2)}`;
  weatherVisibility.textContent = `${(data.visibilityM / 1000).toFixed(1)} km`;
  weatherSystem.textContent = describePrimarySystem(data.extremeEvents);
}

function describePrimarySystem(events: WeatherEvent[]): string {
  if (events.length === 0) return 'No major system';

  const primary = events[0];
  return `${primary.strengthLabel} ${formatType(primary.type)} • ${Math.round(primary.windKmh)} km/h`;
}

function formatType(type: WeatherEvent['type']): string {
  switch (type) {
    case 'hurricane':
      return 'hurricane';
    case 'cyclone':
      return 'cyclone';
    case 'tropical-storm':
      return 'tropical storm';
    case 'heavy-rain-cell':
      return 'rain cell';
    case 'wind-pattern':
      return 'wind band';
  }
}

bootstrap().catch((err: unknown) => {
  console.error('[main] Bootstrap error:', err);
  loadingOverlay.textContent = '⚠️ Failed to load. Check console for details.';
});
