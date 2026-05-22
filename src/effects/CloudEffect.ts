/**
 * effects/CloudEffect.ts
 *
 * Renders slowly drifting cloud-like shapes using layered radial gradients.
 */

interface Cloud {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  speed: number;
}

const CLOUD_COUNT = 6;

export class CloudEffect {
  private clouds: Cloud[] = [];
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.initClouds();
  }

  update(ctx: CanvasRenderingContext2D, dt: number): void {
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;

    for (const cloud of this.clouds) {
      cloud.x += (cloud.speed * dt) / 16;
      if (cloud.x > this.width + 250) {
        cloud.x = -250;
        cloud.y = this.height * (0.0 + Math.random() * 0.25);
      }

      this.drawCloud(ctx, cloud);
    }
  }

  destroy(): void {
    this.clouds = [];
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private initClouds(): void {
    this.clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => ({
      x: (this.width / CLOUD_COUNT) * i + Math.random() * 100,
      y: this.height * (Math.random() * 0.25),
      scaleX: 1.5 + Math.random() * 2,
      scaleY: 0.6 + Math.random() * 0.8,
      alpha: 0.12 + Math.random() * 0.18,
      speed: 0.3 + Math.random() * 0.5,
    }));
  }

  private drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud): void {
    const puffs = [
      { ox: 0, oy: 0, r: 70 },
      { ox: 60, oy: -20, r: 55 },
      { ox: -60, oy: -15, r: 50 },
      { ox: 110, oy: 10, r: 45 },
      { ox: -110, oy: 10, r: 40 },
    ];

    for (const puff of puffs) {
      const px = cloud.x + puff.ox * cloud.scaleX;
      const py = cloud.y + puff.oy * cloud.scaleY;
      const pr = puff.r * ((cloud.scaleX + cloud.scaleY) / 2);

      const gradient = ctx.createRadialGradient(px, py, 0, px, py, pr);
      gradient.addColorStop(0, `rgba(180, 190, 210, ${cloud.alpha})`);
      gradient.addColorStop(1, 'rgba(180, 190, 210, 0)');

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
