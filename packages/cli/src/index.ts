import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { init } from "./init";
import { readProject, syncTypes } from "./project";
import { startServer } from "./server";

const HELP = `Uso:
  meumotor init [pasta]     Cria um projeto novo
  meumotor [pasta]          Abre o editor do projeto (padrão: pasta atual)

Opções:
  -p, --port N     Porta preferida (padrão: 5173)
  --no-open        Não abrir o navegador
  -h, --help       Mostrar esta ajuda`;

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? ["open", url]
    : process.platform === "win32" ? ["cmd", "/c", "start", "", url]
    : ["xdg-open", url];
  try {
    const child = spawn(cmd[0]!, cmd.slice(1), { stdio: "ignore", detached: true });
    child.on("error", () => console.log(`Abra manualmente: ${url}`));
    child.unref();
  } catch {
    console.log(`Abra manualmente: ${url}`);
  }
}

const args = process.argv.slice(2);
const positionals: string[] = [];
let port = 5173;
let open = true;
for (let i = 0; i < args.length; i++) {
  const a = args[i]!;
  if (a === "-h" || a === "--help") { console.log(HELP); process.exit(0); }
  else if (a === "--no-open") open = false;
  else if (a === "-p" || a === "--port") port = Number(args[++i]);
  else if (!a.startsWith("-")) positionals.push(a);
}

if (positionals[0] === "init") {
  await init(resolve(positionals[1] ?? "."));
} else {
  const dir = resolve(positionals[0] ?? ".");
  let cfg;
  try {
    cfg = await readProject(dir);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
  if (!cfg) {
    console.error(`Nenhum game.json em ${dir}.\nCrie um projeto com:  meumotor init`);
    process.exit(1);
  }
  await syncTypes(dir);
  startServer(dir, port, (url) => {
    console.log(`MeuMotor em ${url}`);
    console.log(`Projeto: ${cfg.name} (${dir})`);
    console.log("Ctrl+C para encerrar.");
    if (open) openBrowser(url);
  });
}
