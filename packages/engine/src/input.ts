/** Estado de teclado simples: consulta por frame. */
export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();

  constructor(target: Window | HTMLElement = window) {
    target.addEventListener("keydown", (e) => {
      const k = (e as KeyboardEvent).code;
      if (!this.down.has(k)) this.pressed.add(k);
      this.down.add(k);
    });
    target.addEventListener("keyup", (e) => this.down.delete((e as KeyboardEvent).code));
    window.addEventListener("blur", () => this.down.clear());
  }

  isDown(code: string): boolean {
    return this.down.has(code);
  }
  /** Verdadeiro apenas no frame em que a tecla foi pressionada. */
  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }
  /** Chamado pelo Game ao fim de cada frame. */
  endFrame(): void {
    this.pressed.clear();
  }
}
