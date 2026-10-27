import { cp, readFile, rm } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Pasta `dist/` da instalação global (onde ficam motor, editor, tipos e templates). */
export const distDir = fileURLToPath(new URL(".", import.meta.url));

export interface ProjectConfig {
  name: string;
  width: number;
  height: number;
  entry: string;
}

/** Lê `game.json`. Retorna null se não existir; lança erro se for inválido. */
export async function readProject(dir: string): Promise<ProjectConfig | null> {
  let text: string;
  try {
    text = await readFile(join(dir, "game.json"), "utf8");
  } catch {
    return null;
  }
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new Error(`game.json inválido: ${(e as Error).message}`);
  }
  const str = (v: unknown, d: string) => (typeof v === "string" && v ? v : d);
  const num = (v: unknown, d: number) => (typeof v === "number" && v > 0 ? v : d);
  return {
    name: str(raw.name, basename(dir)),
    width: num(raw.width, 640),
    height: num(raw.height, 360),
    entry: str(raw.entry, "src/main.ts"),
  };
}

/** Copia os tipos do motor para `.meumotor/types` (autocompletar no editor de código, sem node_modules). */
export async function syncTypes(dir: string): Promise<void> {
  const dest = join(dir, ".meumotor", "types");
  await rm(dest, { recursive: true, force: true });
  await cp(join(distDir, "types"), dest, { recursive: true });
}
