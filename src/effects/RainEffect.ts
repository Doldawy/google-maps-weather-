/**
 * effects/RainEffect.ts
 *
 * Renders animated falling rain drops on the canvas overlay.
 * Drop density and speed scale with wind speed (set via setIntensity).
 */

interface Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

const DROP_COUNT = 200;

export class RainEffect {
  private drops: Raindrop[] = [];
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.initDrops();
  }

  update(ctx: CanvasRenderingContext2D, dt: number): void {
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;

    ctx.save();
    ctx.strokeStyle = 'rgba(180, 210, 255, 0.55)';
    ctx.lineWidth = 1.2;

    for (const drop of this.drops) {
      ctx.globalAlpha = drop.opacity;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      // Slight diagonal angle to simulate wind
      ctx.lineTo(drop.x + drop.length * 0.15, drop.y + drop.length);
      ctx.stroke();

      // Advance drop
      drop.y += (drop.speed * dt) / 16;
      drop.x += (drop.speed * 0.12 * dt) / 16;

      if (drop.y > this.height) {
        this.resetDrop(drop);
      }
    }

    ctx.restore();
  }

  destroy(): void {
    this.drops = [];
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private initDrops(): void {
    this.drops = Array.from({ length: DROP_COUNT }, () => this.createDrop());
  }

  private createDrop(): Raindrop {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      length: 15 + Math.random() * 20,
      speed: 8 + Math.random() * 12,
      opacity: 0.3 + Math.random() * 0.5,
    };
  }

  private resetDrop(drop: Raindrop): void {
    drop.y = -drop.length;
    drop.x = Math.random() * this.width;
    drop.speed = 8 + Math.random() * 12;
    drop.opacity = 0.3 + Math.random() * 0.5;
  }
}
