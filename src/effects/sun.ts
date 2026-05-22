/**
 * /src/effects/sun.ts
 *
 * Sunlight glow / lens-flare overlay rendered on canvas.
 */

export class SunEffect {
  private enabled = true;
  private time = 0;

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

  /**
   * Draw the sunlight glow.
   *
   * @param intensity  0 = no sun, 1 = full sun
   */
  draw(intensity: number): void {
    if (!this.enabled || intensity <= 0) return;

    this.time += 0.008;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Primary glow — top-right quadrant (sun position)
    const sunX = w * 0.78;
    const sunY = h * 0.22;
    const pulse = 1 + 0.04 * Math.sin(this.time);
    const radius = Math.max(w, h) * 0.55 * pulse;

    ctx.save();

    // Outer halo
    const halo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, radius);
    halo.addColorStop(0, `rgba(255, 240, 180, ${0.18 * intensity})`);
    halo.addColorStop(0.3, `rgba(255, 200, 80, ${0.10 * intensity})`);
    halo.addColorStop(1, 'rgba(255, 160, 0, 0)');

    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    // Lens streak
    ctx.globalAlpha = 0.08 * intensity;
    ctx.strokeStyle = 'rgba(255, 240, 200, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sunX - w * 0.3, sunY + h * 0.3);
    ctx.lineTo(sunX + w * 0.1, sunY - h * 0.15);
    ctx.stroke();

    ctx.restore();
  }
}
