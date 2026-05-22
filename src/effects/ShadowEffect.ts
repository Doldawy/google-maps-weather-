/**
 * effects/ShadowEffect.ts
 *
 * Renders a subtle directional shadow vignette to simulate cloud shadows
 * or the sun casting long shadows from the side (driver perspective).
 */

export class ShadowEffect {
  private time = 0;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
  }

  update(ctx: CanvasRenderingContext2D, dt: number): void {
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;
    this.time += dt / 1000;

    // Slowly oscillating shadow from the sides to simulate moving cloud shadows
    const shadowAlpha = 0.1 + 0.05 * Math.sin(this.time * 0.2);

    // Left edge shadow
    const leftGradient = ctx.createLinearGradient(0, 0, this.width * 0.35, 0);
    leftGradient.addColorStop(0, `rgba(10, 10, 20, ${shadowAlpha})`);
    leftGradient.addColorStop(1, 'rgba(10, 10, 20, 0)');

    ctx.save();
    ctx.fillStyle = leftGradient;
    ctx.fillRect(0, 0, this.width * 0.35, this.height);
    ctx.restore();

    // Right edge shadow (less intense)
    const rightGradient = ctx.createLinearGradient(
      this.width,
      0,
      this.width * 0.65,
      0,
    );
    rightGradient.addColorStop(0, `rgba(10, 10, 20, ${shadowAlpha * 0.6})`);
    rightGradient.addColorStop(1, 'rgba(10, 10, 20, 0)');

    ctx.save();
    ctx.fillStyle = rightGradient;
    ctx.fillRect(this.width * 0.65, 0, this.width * 0.35, this.height);
    ctx.restore();

    // Bottom shadow / ground darkness
    const bottomGradient = ctx.createLinearGradient(0, this.height * 0.7, 0, this.height);
    bottomGradient.addColorStop(0, 'rgba(10, 10, 20, 0)');
    bottomGradient.addColorStop(1, `rgba(10, 10, 20, ${shadowAlpha * 0.8})`);

    ctx.save();
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, this.height * 0.7, this.width, this.height * 0.3);
    ctx.restore();
  }

  destroy(): void {
    // No resources to release
  }
}
