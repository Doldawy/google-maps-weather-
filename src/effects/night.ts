/**
 * /src/effects/night.ts
 *
 * Day/night gradient overlay that reacts to local sunrise and sunset times.
 */

import type { WeatherData } from '../weather/types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export class NightEffect {
  private enabled = true;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
  ) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  draw(weather: WeatherData): void {
    if (!this.enabled) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const intensity = this.getNightIntensity(weather);

    if (intensity <= 0) return;

    ctx.save();

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, `rgba(6, 16, 44, ${0.82 * intensity})`);
    sky.addColorStop(0.45, `rgba(22, 32, 76, ${0.55 * intensity})`);
    sky.addColorStop(1, `rgba(6, 10, 22, ${0.18 * intensity})`);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const horizonGlow = ctx.createRadialGradient(
      width * 0.5,
      height * 0.85,
      0,
      width * 0.5,
      height * 0.85,
      Math.max(width, height) * 0.75,
    );
    horizonGlow.addColorStop(0, `rgba(95, 125, 255, ${0.08 * intensity})`);
    horizonGlow.addColorStop(0.55, `rgba(58, 78, 180, ${0.05 * intensity})`);
    horizonGlow.addColorStop(1, 'rgba(20, 30, 60, 0)');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  private getNightIntensity(weather: WeatherData): number {
    const twilightWindowMs = 45 * 60 * 1000;
    const { localTimeMs, sunriseMs, sunsetMs, cloudiness } = weather;

    if (localTimeMs <= sunriseMs - twilightWindowMs) return 0.9;
    if (localTimeMs < sunriseMs + twilightWindowMs) {
      const progress = clamp(
        (localTimeMs - (sunriseMs - twilightWindowMs)) / (twilightWindowMs * 2),
        0,
        1,
      );
      return 0.9 - progress * 0.75;
    }

    if (localTimeMs < sunsetMs - twilightWindowMs) {
      return cloudiness > 80 ? 0.18 : 0.06;
    }

    if (localTimeMs < sunsetMs + twilightWindowMs) {
      const progress = clamp(
        (localTimeMs - (sunsetMs - twilightWindowMs)) / (twilightWindowMs * 2),
        0,
        1,
      );
      return 0.15 + progress * 0.75;
    }

    return 0.92;
  }
}
