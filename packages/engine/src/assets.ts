/** Carrega e guarda em cache os arquivos da pasta `assets/` do projeto. */
export class Assets {
  private loaded = new Map<string, HTMLImageElement>();
  private pending = new Map<string, Promise<HTMLImageElement>>();

  constructor(private readonly base = "/assets/") {}

  image(name: string): Promise<HTMLImageElement> {
    let p = this.pending.get(name);
    if (!p) {
      p = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => { this.loaded.set(name, img); resolve(img); };
        img.onerror = () => { this.pending.delete(name); reject(new Error(`Asset não encontrado: ${name}`)); };
        img.src = this.base + name;
      });
      this.pending.set(name, p);
    }
    return p;
  }

  /** Acesso síncrono a uma imagem já carregada (carregue no `preload()` da cena). */
  getImage(name: string): HTMLImageElement {
    const img = this.loaded.get(name);
    if (!img) throw new Error(`Imagem "${name}" ainda não foi carregada. Use assets.image() no preload().`);
    return img;
  }
}
