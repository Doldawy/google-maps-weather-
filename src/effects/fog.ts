/**
 * /src/effects/fog.ts
 *
 * Animated fog / mist overlay rendered on canvas.
 */

interface FogLayer {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

export class FogEffect {
  private layers: FogLayer[] = [];
  private enabled = true;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
  ) {
    this.initLayers();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private initLayers(): void {
    this.layers = Array.from({ length: 6 }, (_, i) =>
      this.createLayer(i * (this.canvas.width / 6)),
    );
  }

  private createLayer(startX?: number): FogLayer {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      x: startX ?? -w * 0.4,
      y: Math.random() * h * 0.7,
      width: w * (0.4 + Math.random() * 0.6),
      height: h * (0.1 + Math.random() * 0.2),
      speed: 0.15 + Math.random() * 0.3,
      opacity: 0.04 + Math.random() * 0.08,
    };
  }

  draw(intensity: number): void {
    if (!this.enabled || intensity <= 0) return;

    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.save();
    ctx.globalAlpha = Math.min(intensity, 1);

    for (const layer of this.layers) {
      const grad = ctx.createLinearGradient(
        layer.x,
        layer.y,
        layer.x + layer.width,
        layer.y,
      );
      grad.addColorStop(0, 'rgba(220, 230, 240, 0)');
      grad.addColorStop(0.3, `rgba(220, 230, 240, ${layer.opacity})`);
      grad.addColorStop(0.7, `rgba(220, 230, 240, ${layer.opacity})`);
      grad.addColorStop(1, 'rgba(220, 230, 240, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(layer.x, layer.y, layer.width, layer.height);

      // Drift
      layer.x += layer.speed;
      if (layer.x > w) {
        Object.assign(layer, this.createLayer());
      }
    }

    ctx.restore();
  }
}
