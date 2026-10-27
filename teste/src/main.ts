import { Scene } from "meumotor";

/** Cena inicial: um quadrado controlável por setas ou WASD. */
export default class MainScene extends Scene {
  private x = 0;
  private y = 0;
  private px = 0;
  private py = 0;
  private readonly size = 48;
  private readonly speed = 240;

  override start(): void {
    this.x = this.px = (this.game.width - this.size) / 2;
    this.y = this.py = (this.game.height - this.size) / 2;
  }

  override update(dt: number): void {
    const { input, width, height } = this.game;
    this.px = this.x;
    this.py = this.y;
    let dx = 0, dy = 0;
    if (input.isDown("ArrowLeft") || input.isDown("KeyA")) dx -= 1;
    if (input.isDown("ArrowRight") || input.isDown("KeyD")) dx += 1;
    if (input.isDown("ArrowUp") || input.isDown("KeyW")) dy -= 1;
    if (input.isDown("ArrowDown") || input.isDown("KeyS")) dy += 1;
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    this.x = Math.max(0, Math.min(width - this.size, this.x + dx * this.speed * dt));
    this.y = Math.max(0, Math.min(height - this.size, this.y + dy * this.speed * dt));
  }

  override render(ctx: CanvasRenderingContext2D, alpha: number): void {
    const { width, height } = this.game;
    ctx.fillStyle = "#17222e";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#22313f";
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= width; gx += 32) { ctx.beginPath(); ctx.moveTo(gx + .5, 0); ctx.lineTo(gx + .5, height); ctx.stroke(); }
    for (let gy = 0; gy <= height; gy += 32) { ctx.beginPath(); ctx.moveTo(0, gy + .5); ctx.lineTo(width, gy + .5); ctx.stroke(); }

    const rx = this.px + (this.x - this.px) * alpha;
    const ry = this.py + (this.y - this.py) * alpha;
    ctx.fillStyle = "#f2b134";
    ctx.fillRect(rx, ry, this.size, this.size);
  }
}
