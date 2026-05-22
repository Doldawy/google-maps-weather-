/**
 * /src/map/index.ts
 *
 * Google Maps initialisation and driver-style rendering utilities.
 */

import { driverStyle, defaultStyle } from './styles';

export { driverStyle, defaultStyle };

/** Options passed to initMap(). */
export interface MapOptions {
  apiKey: string;
  containerId: string;
  center: { lat: number; lng: number };
  zoom: number;
  driverModeEnabled: boolean;
}

/**
 * Dynamically load the Google Maps JavaScript API script, then resolve.
 * Safe to call multiple times — resolves immediately on subsequent calls.
 */
function loadMapsApi(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (typeof google !== 'undefined' && google.maps) {
      resolve();
      return;
    }

    const callbackName = '__gmapsInitCallback';

    // Expose the callback on window so the script tag can invoke it
    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () =>
      reject(new Error('[map] Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

/**
 * Initialise and return a Google Map instance.
 *
 * Loads the Maps API if it hasn't been loaded yet, then creates the map
 * inside the element identified by `containerId`.
 */
export async function initMap(opts: MapOptions): Promise<google.maps.Map> {
  await loadMapsApi(opts.apiKey);

  const container = document.getElementById(opts.containerId);
  if (!container) {
    throw new Error(`[map] Container #${opts.containerId} not found`);
  }

  const map = new google.maps.Map(container, {
    center: opts.center,
    zoom: opts.zoom,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: opts.driverModeEnabled ? driverStyle : defaultStyle,
    // Smooth tilt for driver feel
    tilt: 45,
    heading: 0,
    gestureHandling: 'greedy',
    backgroundColor: '#0d0d0d',
  });

  return map;
}

/**
 * Apply or remove the driver-style map theme.
 */
export function applyDriverStyle(
  map: google.maps.Map,
  enabled: boolean,
): void {
  map.setOptions({ styles: enabled ? driverStyle : defaultStyle });
}

/**
 * Smoothly animate the map camera to a new heading.
 * Useful to simulate the "cinematic" driver camera motion.
 */
export function animateHeading(
  map: google.maps.Map,
  targetHeading: number,
  durationMs = 600,
): void {
  const start = map.getHeading() ?? 0;
  const diff = targetHeading - start;
  const startTime = performance.now();

  function step(now: number) {
    const t = Math.min((now - startTime) / durationMs, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    map.setHeading(start + diff * eased);
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
