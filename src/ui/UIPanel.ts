/**
 * ui/UIPanel.ts
 *
 * Manages the toggle panel DOM interactions.
 * Bridges user toggle events with the EffectsEngine and updates the
 * weather display section when new data arrives.
 */

import type { EffectsEngine, EffectName } from '../effects/EffectsEngine';
import type { WeatherData } from '../weather/types';

const CONDITION_ICONS: Record<string, string> = {
  clear: '☀️',
  clouds: '☁️',
  rain: '🌧',
  drizzle: '🌦',
  fog: '🌫',
  snow: '❄️',
  thunderstorm: '⛈',
  unknown: '🌡',
};

/** Maps each checkbox element ID to its corresponding effect name. */
const TOGGLE_MAP: ReadonlyArray<[string, EffectName]> = [
  ['toggle-rain', 'rain'],
  ['toggle-sun', 'sun'],
  ['toggle-fog', 'fog'],
  ['toggle-clouds', 'clouds'],
  ['toggle-shadows', 'shadows'],
];

export class UIPanel {
  private engine: EffectsEngine;

  constructor(engine: EffectsEngine) {
    this.engine = engine;
    this.bindToggles();
  }

  /** Update the weather info block in the panel. */
  updateWeatherDisplay(weather: WeatherData): void {
    const icon = document.getElementById('weather-icon');
    const condition = document.getElementById('weather-condition');
    const temp = document.getElementById('weather-temp');
    const status = document.getElementById('status-bar');

    if (icon) icon.textContent = CONDITION_ICONS[weather.condition] ?? '🌡';
    if (condition) condition.textContent = this.capitalize(weather.description);
    if (temp) {
      temp.textContent = `${weather.tempC}°C · ${weather.cityName} · 💧${weather.humidity}%`;
    }
    if (status) status.textContent = `Updated ${new Date(weather.timestamp * 1000).toLocaleTimeString()}`;
  }

  /** Sync toggle checkbox states to the current engine state. */
  syncToggles(): void {
    for (const [id, effect] of TOGGLE_MAP) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.checked = this.engine.isEnabled(effect);
    }
  }

  setStatus(message: string): void {
    const status = document.getElementById('status-bar');
    if (status) status.textContent = message;
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private bindToggles(): void {
    for (const [id, effect] of TOGGLE_MAP) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (!el) continue;

      el.addEventListener('change', () => {
        if (el.checked) {
          this.engine.enable(effect);
        } else {
          this.engine.disable(effect);
        }
      });
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
