/**
 * /src/map/weatherLayer.ts
 *
 * Global weather overlays and storm markers rendered on top of Google Maps.
 */

import type { WeatherData, WeatherEvent } from '../weather/types';

interface LayerToggles {
  rain: boolean;
  clouds: boolean;
  wind: boolean;
  extreme: boolean;
}

type OverlayKey = 'clouds' | 'precipitation' | 'wind' | 'pressure';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function colorForEventType(type: WeatherEvent['type']): string {
  switch (type) {
    case 'hurricane':
      return '#ff6b6b';
    case 'cyclone':
      return '#ff9f43';
    case 'tropical-storm':
      return '#ffd166';
    case 'heavy-rain-cell':
      return '#5dade2';
    case 'wind-pattern':
      return '#8ec5ff';
  }
}

class StormMarkerOverlay extends google.maps.OverlayView {
  private element: HTMLDivElement | null = null;

  constructor(private eventData: WeatherEvent) {
    super();
  }

  update(eventData: WeatherEvent): void {
    this.eventData = eventData;
    this.syncContent();
    this.draw();
  }

  onAdd(): void {
    const element = document.createElement('div');
    element.className = `storm-marker storm-marker--${this.eventData.type}`;
    this.element = element;
    this.syncContent();

    const panes = this.getPanes();
    panes?.overlayMouseTarget.appendChild(element);
  }

  draw(): void {
    if (!this.element) return;

    const projection = this.getProjection();
    if (!projection) return;

    const point = projection.fromLatLngToDivPixel(
      new google.maps.LatLng(this.eventData.position.lat, this.eventData.position.lng),
    );

    if (!point) return;

    this.element.style.left = `${point.x}px`;
    this.element.style.top = `${point.y}px`;
  }

  onRemove(): void {
    this.element?.remove();
    this.element = null;
  }

  private syncContent(): void {
    if (!this.element) return;

    const size = Math.round(clamp(this.eventData.sizeKm / 8, 48, 120));
    const duration = clamp(9 - this.eventData.strength * 5, 3.8, 8.5);

    this.element.dataset.rotation = this.eventData.rotationDirection;
    this.element.style.setProperty('--storm-size', `${size}px`);
    this.element.style.setProperty('--storm-color', colorForEventType(this.eventData.type));
    this.element.style.setProperty('--storm-rotation-duration', `${duration}s`);
    this.element.style.setProperty('--storm-scale', `${0.9 + this.eventData.strength * 0.55}`);
    this.element.innerHTML = `
      <div class="storm-marker__core">
        <div class="storm-marker__swirl"></div>
        <div class="storm-marker__eye"></div>
      </div>
      <div class="storm-marker__label">
        <strong>${this.eventData.strengthLabel}</strong>
        <span>${Math.round(this.eventData.windKmh)} km/h • ${Math.round(this.eventData.sizeKm)} km</span>
      </div>
    `;
    this.element.title = this.eventData.description;
  }
}

export class GlobalWeatherLayer {
  private readonly overlays = new Map<OverlayKey, google.maps.ImageMapType>();
  private readonly stormMarkers = new Map<string, StormMarkerOverlay>();
  private readonly toggles: LayerToggles = {
    rain: true,
    clouds: true,
    wind: true,
    extreme: true,
  };
  private weather: WeatherData | null = null;

  constructor(
    private readonly map: google.maps.Map,
    private readonly apiKey: string,
  ) {
    this.initTileLayers();
  }

  setWeather(weather: WeatherData): void {
    this.weather = weather;
    this.syncOverlayOpacity();
    this.syncStormMarkers();
  }

  setToggles(toggles: Partial<LayerToggles>): void {
    Object.assign(this.toggles, toggles);
    this.syncOverlayOpacity();
    this.syncStormMarkers();
  }

  private initTileLayers(): void {
    if (this.apiKey === 'YOUR_OPENWEATHER_API_KEY_HERE') return;

    const overlaySpecs: Array<{ key: OverlayKey; layerName: string; opacity: number }> = [
      { key: 'clouds', layerName: 'clouds_new', opacity: 0.3 },
      { key: 'precipitation', layerName: 'precipitation_new', opacity: 0.22 },
      { key: 'wind', layerName: 'wind_new', opacity: 0.24 },
      { key: 'pressure', layerName: 'pressure_new', opacity: 0.18 },
    ];

    for (const spec of overlaySpecs) {
      const overlay = new google.maps.ImageMapType({
        tileSize: new google.maps.Size(256, 256),
        maxZoom: 19,
        minZoom: 0,
        opacity: spec.opacity,
        name: spec.layerName,
        getTileUrl: (coord, zoom) =>
          `https://tile.openweathermap.org/map/${spec.layerName}/${zoom}/${coord.x}/${coord.y}.png?appid=${encodeURIComponent(this.apiKey)}`,
      });

      this.map.overlayMapTypes.push(overlay);
      this.overlays.set(spec.key, overlay);
    }
  }

  private syncOverlayOpacity(): void {
    if (!this.weather) return;

    this.overlays.get('clouds')?.setOpacity(
      this.toggles.clouds ? clamp(0.18 + this.weather.cloudiness / 140, 0.18, 0.6) : 0,
    );
    this.overlays.get('precipitation')?.setOpacity(
      this.toggles.rain ? clamp(0.1 + this.weather.precipitationMm / 24, 0.1, 0.58) : 0,
    );
    this.overlays.get('wind')?.setOpacity(
      this.toggles.wind ? clamp(0.12 + this.weather.windKmh / 180, 0.12, 0.52) : 0,
    );
    this.overlays.get('pressure')?.setOpacity(
      this.toggles.extreme && this.weather.extremeEvents.length > 0
        ? clamp(0.12 + this.weather.extremeEvents[0].strength * 0.3, 0.12, 0.42)
        : 0,
    );
  }

  private syncStormMarkers(): void {
    const activeEvents =
      this.toggles.extreme && this.weather
        ? this.weather.extremeEvents.filter((event) => event.type !== 'wind-pattern')
        : [];

    const activeIds = new Set(activeEvents.map((event) => event.id));

    for (const [id, marker] of this.stormMarkers.entries()) {
      if (!activeIds.has(id)) {
        marker.setMap(null);
        this.stormMarkers.delete(id);
      }
    }

    for (const event of activeEvents) {
      const existing = this.stormMarkers.get(event.id);
      if (existing) {
        existing.update(event);
        continue;
      }

      const marker = new StormMarkerOverlay(event);
      marker.setMap(this.map);
      this.stormMarkers.set(event.id, marker);
    }
  }
}
