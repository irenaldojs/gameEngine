import type { Game } from "./game";

/** Uma cena é uma "tela" do jogo: menu, fase, etc. */
export abstract class Scene {
  game!: Game;

  /** Carrega assets antes da cena começar. */
  async preload(): Promise<void> {}
  /** Chamado quando a cena entra em jogo. */
  start(): void {}
  /** Lógica fixa (dt em segundos, sempre o mesmo valor). */
  abstract update(dt: number): void;
  /** Desenho; `alpha` (0–1) permite interpolar entre updates. */
  abstract render(ctx: CanvasRenderingContext2D, alpha: number): void;
  /** Chamado quando a cena sai de jogo. */
  stop(): void {}
}
