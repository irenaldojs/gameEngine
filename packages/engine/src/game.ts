import { Assets } from "./assets";
import { Input } from "./input";
import type { Scene } from "./scene";

export interface GameOptions {
  width: number;
  height: number;
  /** Atualizações de lógica por segundo (passo fixo). */
  tickRate?: number;
}

/**
 * Loop com passo fixo para a lógica e render livre.
 * Mantém a simulação determinística e independente do monitor.
 */
export class Game {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly input: Input;
  readonly assets = new Assets();
  readonly width: number;
  readonly height: number;

  fps = 0;
  running = false;

  private scene: Scene | null = null;
  private readonly step: number;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private frames = 0;
  private fpsClock = 0;
  private sceneToken = 0;

  constructor(canvas: HTMLCanvasElement, opts: GameOptions) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D indisponível neste navegador.");
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = opts.width;
    this.height = opts.height;
    this.step = 1 / (opts.tickRate ?? 60);
    this.input = new Input();
    this.resize();
  }

  /** Ajusta a resolução interna ao devicePixelRatio, mantendo o espaço lógico width×height. */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Troca a cena: para a atual, carrega os assets da nova e a inicia. */
  async setScene(scene: Scene): Promise<void> {
    const token = ++this.sceneToken;
    this.scene?.stop();
    this.scene = null;
    scene.game = this;
    await scene.preload();
    if (token !== this.sceneToken) return; // outra troca começou enquanto carregava
    this.scene = scene;
    scene.start();
    if (!this.running) this.drawOnce();
  }

  play(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Reinicia a cena atual. */
  async restart(): Promise<void> {
    if (this.scene) await this.setScene(this.scene);
  }

  private drawOnce(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.scene?.render(this.ctx, 0);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    // limita o salto após aba em segundo plano
    const delta = Math.min((now - this.last) / 1000, 0.25);
    this.last = now;
    this.acc += delta;

    while (this.acc >= this.step) {
      this.scene?.update(this.step);
      this.input.endFrame();
      this.acc -= this.step;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.scene?.render(this.ctx, this.acc / this.step);

    this.frames++;
    this.fpsClock += delta;
    if (this.fpsClock >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsClock);
      this.frames = 0;
      this.fpsClock = 0;
    }
    this.raf = requestAnimationFrame(this.frame);
  };
}
