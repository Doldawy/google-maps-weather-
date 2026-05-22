/**
 * /src/effects/index.ts
 *
 * EffectsManager — orchestrates all weather overlay effects on a single canvas.
 *
 * Each frame, it clears the canvas and composites enabled effects in order:
 *   clouds → fog → rain → sun
 */

import { RainEffect } from './rain';
import { SunEffect } from './sun';
import { FogEffect } from './fog';
import { CloudEffect } from './clouds';
import type { WeatherData } from '../weather/types';

export interface EffectToggles {
  rain: boolean;
  sun: boolean;
  fog: boolean;
  clouds: boolean;
}

export class EffectsManager {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  private readonly rainEffect: RainEffect;
  private readonly sunEffect: SunEffect;
  private readonly fogEffect: FogEffect;
  private readonly cloudEffect: CloudEffect;

  private currentWeather: WeatherData | null = null;
  private animFrameId: number | null = null;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) throw new Error(`[effects] Canvas #${canvasId} not found`);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('[effects] Could not get 2D canvas context');

    this.canvas = canvas;
    this.ctx = ctx;

    this.rainEffect = new RainEffect(canvas, ctx);
    this.sunEffect = new SunEffect(canvas, ctx);
    this.fogEffect = new FogEffect(canvas, ctx);
    this.cloudEffect = new CloudEffect(canvas, ctx);

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /** Set the current weather data that drives effect intensities. */
  setWeather(data: WeatherData): void {
    this.currentWeather = data;
  }

  /** Enable / disable individual effects from the UI. */
  setToggles(toggles: Partial<EffectToggles>): void {
    if (toggles.rain !== undefined) this.rainEffect.setEnabled(toggles.rain);
    if (toggles.sun !== undefined) this.sunEffect.setEnabled(toggles.sun);
    if (toggles.fog !== undefined) this.fogEffect.setEnabled(toggles.fog);
    if (toggles.clouds !== undefined) this.cloudEffect.setEnabled(toggles.clouds);
  }

  /** Start the animation loop. */
  start(): void {
    if (this.animFrameId !== null) return;
    const loop = () => {
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  /** Stop the animation loop. */
  stop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private render(): void {
    const { ctx, canvas, currentWeather: w } = this;

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!w) return;

    // Derive per-effect intensities from weather data
    const rainIntensity = this.getRainIntensity(w);
    const sunIntensity = this.getSunIntensity(w);
    const fogIntensity = this.getFogIntensity(w);
    const cloudIntensity = this.getCloudIntensity(w);

    this.cloudEffect.draw(cloudIntensity);
    this.fogEffect.draw(fogIntensity);
    this.rainEffect.draw(rainIntensity);
    this.sunEffect.draw(sunIntensity);
  }

  // ── Intensity helpers ──────────────────────────────────────────────────────

  private getRainIntensity(w: WeatherData): number {
    if (w.condition === 'rain') return 0.9;
    if (w.condition === 'drizzle') return 0.45;
    if (w.condition === 'thunderstorm') return 1.0;
    return 0;
  }

  private getSunIntensity(w: WeatherData): number {
    if (w.condition === 'clear') return 1.0;
    if (w.condition === 'clouds' && w.cloudiness < 30) return 0.5;
    return 0;
  }

  private getFogIntensity(w: WeatherData): number {
    if (w.condition === 'fog' || w.condition === 'mist') return 1.0;
    if (w.condition === 'haze') return 0.7;
    // Low visibility triggers light fog
    if (w.visibilityM < 3000) return 0.6;
    if (w.visibilityM < 6000) return 0.3;
    return 0;
  }

  private getCloudIntensity(w: WeatherData): number {
    return w.cloudiness / 100;
  }
}
