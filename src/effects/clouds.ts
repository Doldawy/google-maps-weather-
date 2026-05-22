/**
 * /src/effects/clouds.ts
 *
 * Animated cloud-shadow overlay rendered on canvas.
 */

interface CloudShadow {
  x: number;
  y: number;
  rx: number;
  ry: number;
  speed: number;
  opacity: number;
}

export class CloudEffect {
  private shadows: CloudShadow[] = [];
  private enabled = true;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
  ) {
    this.initShadows();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private initShadows(): void {
    this.shadows = Array.from({ length: 5 }, (_, i) =>
      this.createShadow(i * (this.canvas.width / 5)),
    );
  }

  private createShadow(startX?: number): CloudShadow {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      x: startX ?? -w * 0.3,
      y: Math.random() * h,
      rx: w * (0.15 + Math.random() * 0.25),
      ry: h * (0.06 + Math.random() * 0.1),
      speed: 0.2 + Math.random() * 0.4,
      opacity: 0.06 + Math.random() * 0.1,
    };
  }

  draw(intensity: number): void {
    if (!this.enabled || intensity <= 0) return;

    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.save();
    ctx.globalAlpha = Math.min(intensity, 1);

    for (const shadow of this.shadows) {
      ctx.beginPath();
      ctx.ellipse(shadow.x, shadow.y, shadow.rx, shadow.ry, 0, 0, Math.PI * 2);

      const grad = ctx.createRadialGradient(
        shadow.x,
        shadow.y,
        0,
        shadow.x,
        shadow.y,
        Math.max(shadow.rx, shadow.ry),
      );
      grad.addColorStop(0, `rgba(20, 20, 30, ${shadow.opacity})`);
      grad.addColorStop(1, 'rgba(20, 20, 30, 0)');

      ctx.fillStyle = grad;
      ctx.fill();

      shadow.x += shadow.speed;
      if (shadow.x - shadow.rx > w) {
        Object.assign(shadow, this.createShadow());
      }
    }

    ctx.restore();
  }
}
