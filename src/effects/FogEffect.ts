/**
 * effects/FogEffect.ts
 *
 * Renders animated wisps of fog drifting across the screen using
 * layered semi-transparent radial gradients.
 */

interface FogParticle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speedX: number;
  speedY: number;
  phase: number;
}

const PARTICLE_COUNT = 12;

export class FogEffect {
  private particles: FogParticle[] = [];
  private time = 0;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.initParticles();
  }

  update(ctx: CanvasRenderingContext2D, dt: number): void {
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;
    this.time += dt / 1000;

    // Base fog veil across the lower portion of the screen
    const baseGradient = ctx.createLinearGradient(0, this.height * 0.55, 0, this.height);
    baseGradient.addColorStop(0, 'rgba(200, 210, 220, 0)');
    baseGradient.addColorStop(1, 'rgba(200, 210, 220, 0.18)');
    ctx.save();
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    // Drifting fog wisps
    for (const p of this.particles) {
      p.x += (p.speedX * dt) / 16;
      p.y += (p.speedY * dt) / 16;

      // Wrap around edges
      if (p.x > this.width + p.radius) p.x = -p.radius;
      if (p.x < -p.radius) p.x = this.width + p.radius;
      if (p.y > this.height + p.radius) p.y = -p.radius;

      const pulseAlpha = p.alpha * (0.6 + 0.4 * Math.sin(this.time * 0.4 + p.phase));

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      gradient.addColorStop(0, `rgba(220, 230, 240, ${pulseAlpha})`);
      gradient.addColorStop(1, 'rgba(220, 230, 240, 0)');

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  destroy(): void {
    this.particles = [];
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private initParticles(): void {
    this.particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * this.width,
      y: this.height * (0.4 + Math.random() * 0.6),
      radius: 120 + Math.random() * 200,
      alpha: 0.08 + Math.random() * 0.12,
      speedX: 0.2 + Math.random() * 0.6,
      speedY: -0.05 + Math.random() * 0.1,
      phase: Math.random() * Math.PI * 2,
    }));
  }
}
