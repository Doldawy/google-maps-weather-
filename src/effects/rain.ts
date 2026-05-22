/**
 * /src/effects/rain.ts
 *
 * Canvas-based rain particle effect.
 */

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

export class RainEffect {
  private drops: RainDrop[] = [];
  private readonly dropCount = 250;
  private enabled = true;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
  ) {
    this.initDrops();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private initDrops(): void {
    this.drops = Array.from({ length: this.dropCount }, () =>
      this.createDrop(true),
    );
  }

  private createDrop(randomY = false): RainDrop {
    return {
      x: Math.random() * this.canvas.width,
      y: randomY ? Math.random() * this.canvas.height : -20,
      length: 10 + Math.random() * 20,
      speed: 6 + Math.random() * 10,
      opacity: 0.15 + Math.random() * 0.35,
    };
  }

  /** Draw one frame of rain. Call this from the render loop. */
  draw(intensity: number): void {
    if (!this.enabled || intensity <= 0) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = Math.min(intensity, 1);

    for (const drop of this.drops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 1, drop.y + drop.length);
      ctx.strokeStyle = `rgba(180, 210, 255, ${drop.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Advance drop
      drop.y += drop.speed;
      drop.x -= 0.5; // slight diagonal

      if (drop.y > this.canvas.height) {
        Object.assign(drop, this.createDrop(false));
      }
    }

    ctx.restore();
  }
}
