import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { distDir, syncTypes } from "./project";

export async function init(dir: string): Promise<void> {
  if (existsSync(join(dir, "game.json"))) {
    console.error(`Já existe um projeto em ${dir} (game.json encontrado).`);
    process.exit(1);
  }
  mkdirSync(dir, { recursive: true });
  cpSync(join(distDir, "templates"), dir, { recursive: true, force: false });

  const ignore = join(dir, "gitignore");
  if (existsSync(ignore) && !existsSync(join(dir, ".gitignore"))) renameSync(ignore, join(dir, ".gitignore"));

  const cfg = join(dir, "game.json");
  writeFileSync(cfg, readFileSync(cfg, "utf8").replace("__NAME__", basename(dir)));

  await syncTypes(dir);
  console.log(`Projeto criado em ${dir}`);
  console.log("Para abrir o editor: cd na pasta e rode  meumotor");
}
