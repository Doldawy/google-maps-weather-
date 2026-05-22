/**
 * effects/EffectsEngine.ts
 *
 * Manages a full-screen canvas overlay and orchestrates individual
 * weather effect renderers (rain, sunlight, fog, clouds, shadows).
 *
 * Each renderer follows a simple interface: init → update(dt) → destroy.
 * The engine runs a requestAnimationFrame loop and calls every active renderer.
 */

import { RainEffect } from './RainEffect';
import { SunEffect } from './SunEffect';
import { FogEffect } from './FogEffect';
import { CloudEffect } from './CloudEffect';
import { ShadowEffect } from './ShadowEffect';
import type { WeatherData } from '../weather/types';

export type EffectName = 'rain' | 'sun' | 'fog' | 'clouds' | 'shadows';

interface Renderer {
  /** Called once per frame. `dt` is elapsed milliseconds since last frame. */
  update(ctx: CanvasRenderingContext2D, dt: number): void;
  /** Clean up any resources. */
  destroy(): void;
}

export class EffectsEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderers: Map<EffectName, Renderer> = new Map();
  private active: Set<EffectName> = new Set();
  private rafHandle = 0;
  private lastTime = 0;
  private running = false;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas #${canvasId} not found.`);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not obtain 2D canvas context.');
    this.ctx = ctx;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Register all effect renderers
    this.renderers.set('rain', new RainEffect(this.canvas));
    this.renderers.set('sun', new SunEffect(this.canvas));
    this.renderers.set('fog', new FogEffect(this.canvas));
    this.renderers.set('clouds', new CloudEffect(this.canvas));
    this.renderers.set('shadows', new ShadowEffect(this.canvas));
  }

  /** Start the animation loop. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  /** Stop the animation loop. */
  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafHandle);
  }

  /** Enable a named effect. */
  enable(name: EffectName): void {
    this.active.add(name);
  }

  /** Disable a named effect. */
  disable(name: EffectName): void {
    this.active.delete(name);
  }

  /** Toggle a named effect. Returns the new enabled state. */
  toggle(name: EffectName): boolean {
    if (this.active.has(name)) {
      this.disable(name);
      return false;
    }
    this.enable(name);
    return true;
  }

  isEnabled(name: EffectName): boolean {
    return this.active.has(name);
  }

  /**
   * Automatically activate the appropriate effects based on live weather data.
   * Manual toggles (from the UI) are applied on top of this baseline.
   */
  applyWeather(weather: WeatherData): void {
    // Reset auto effects; preserve any manual overrides that were already toggled
    this.disable('rain');
    this.disable('sun');
    this.disable('fog');
    this.disable('clouds');
    this.disable('shadows');

    switch (weather.condition) {
      case 'clear':
        this.enable('sun');
        this.enable('shadows');
        break;
      case 'clouds':
        this.enable('clouds');
        if (weather.cloudCoverage > 70) this.enable('shadows');
        break;
      case 'rain':
      case 'drizzle':
        this.enable('rain');
        this.enable('clouds');
        break;
      case 'thunderstorm':
        this.enable('rain');
        this.enable('clouds');
        break;
      case 'fog':
        this.enable('fog');
        this.enable('clouds');
        break;
      case 'snow':
        this.enable('clouds');
        this.enable('fog');
        break;
      default:
        break;
    }
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private loop(now: number): void {
    if (!this.running) return;

    const dt = Math.min(now - this.lastTime, 100); // Cap dt at 100ms to avoid jumps
    this.lastTime = now;

    // Clear the entire canvas each frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const name of this.active) {
      const renderer = this.renderers.get(name);
      if (renderer) renderer.update(this.ctx, dt);
    }

    this.rafHandle = requestAnimationFrame((t) => this.loop(t));
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
}
