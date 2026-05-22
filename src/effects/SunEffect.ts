/**
 * effects/SunEffect.ts
 *
 * Renders a warm radial sunlight glow emanating from the top-right corner
 * to simulate an overhead sun and lens-flare bokeh effect.
 */

interface LensFlare {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
  pulse: number;
}

const FLARE_COUNT = 5;

export class SunEffect {
  private flares: LensFlare[] = [];
  private time = 0;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.initFlares();
  }

  update(ctx: CanvasRenderingContext2D, dt: number): void {
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;
    this.time += dt / 1000;

    // Large ambient sun glow from top-right
    const sunX = this.width * 0.78;
    const sunY = this.height * 0.05;
    const sunRadius = Math.min(this.width, this.height) * 0.55;

    const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
    gradient.addColorStop(0, 'rgba(255, 220, 100, 0.18)');
    gradient.addColorStop(0.4, 'rgba(255, 180, 50, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    // Animate small bokeh flares
    for (const flare of this.flares) {
      const pulsedRadius = flare.radius * (1 + 0.15 * Math.sin(this.time * flare.pulse));
      const alpha = flare.alpha * (0.7 + 0.3 * Math.sin(this.time * flare.pulse * 0.7));

      const fg = ctx.createRadialGradient(
        flare.x,
        flare.y,
        0,
        flare.x,
        flare.y,
        pulsedRadius,
      );
      fg.addColorStop(0, `rgba(255, 240, 180, ${alpha})`);
      fg.addColorStop(1, 'rgba(255, 200, 80, 0)');

      ctx.save();
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(flare.x, flare.y, pulsedRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  destroy(): void {
    this.flares = [];
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private initFlares(): void {
    this.flares = Array.from({ length: FLARE_COUNT }, () => ({
      x: this.width * (0.6 + Math.random() * 0.35),
      y: this.height * (Math.random() * 0.25),
      radius: 30 + Math.random() * 60,
      alpha: 0.08 + Math.random() * 0.12,
      speed: 0.2 + Math.random() * 0.5,
      pulse: 0.5 + Math.random() * 1.5,
    }));
  }
}
