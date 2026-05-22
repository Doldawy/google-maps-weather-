/**
 * main.ts
 *
 * Application entry point.
 * Wires together: MapController → WeatherService → EffectsEngine → UIPanel.
 */

import { MapController } from './map/MapController';
import { WeatherService } from './weather/WeatherService';
import { EffectsEngine } from './effects/EffectsEngine';
import { UIPanel } from './ui/UIPanel';
import { config } from './config/env';

async function main(): Promise<void> {
  // ── 1. Initialise the map ────────────────────────────────────────────────
  const mapController = new MapController('map');

  let map: google.maps.Map;
  try {
    map = await mapController.init();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Map init failed:', msg);
    const status = document.getElementById('status-bar');
    if (status) status.textContent = `Map error: ${msg}`;
    return;
  }

  // ── 2. Initialise effects engine & UI panel ──────────────────────────────
  const effects = new EffectsEngine('effects-layer');
  const panel = new UIPanel(effects);
  effects.start();

  // ── 3. Centre on user location (best-effort) ─────────────────────────────
  mapController.centreOnUserLocation();

  // ── 4. Fetch & apply weather ──────────────────────────────────────────────
  const weatherService = new WeatherService();

  const refreshWeather = async (): Promise<void> => {
    // Use current map centre for weather coordinates
    const centre = map.getCenter();
    const lat = centre?.lat() ?? config.defaultCenter.lat;
    const lng = centre?.lng() ?? config.defaultCenter.lng;

    panel.setStatus('Fetching weather…');

    try {
      const weather = await weatherService.fetchWeather(lat, lng);
      effects.applyWeather(weather);
      panel.updateWeatherDisplay(weather);
      panel.syncToggles();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Weather fetch failed:', msg);
      panel.setStatus(`Weather unavailable – ${msg}`);
    }
  };

  await refreshWeather();

  // Refresh weather periodically
  setInterval(() => {
    weatherService.invalidateCache();
    void refreshWeather();
  }, config.weatherRefreshIntervalMs);

  // Also refresh when the user moves the map to a new area
  google.maps.event.addListener(map, 'idle', () => {
    weatherService.invalidateCache();
    void refreshWeather();
  });
}

main().catch((err) => {
  console.error('Unhandled error in main():', err);
});
