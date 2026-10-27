import { build, context } from "esbuild";
import { cpSync, mkdirSync, rmSync, chmodSync } from "node:fs";
import { execSync } from "node:child_process";

const watch = process.argv.includes("--watch");
const dist = "packages/cli/dist";

rmSync(dist, { recursive: true, force: true });
mkdirSync(`${dist}/editor`, { recursive: true });

const copyStatic = () => {
  cpSync("packages/editor/index.html", `${dist}/editor/index.html`);
  cpSync("packages/editor/src/style.css", `${dist}/editor/style.css`);
  cpSync("packages/cli/templates", `${dist}/templates`, { recursive: true });
};
const buildTypes = () => execSync("npx tsc -p packages/engine/tsconfig.json", { stdio: "inherit" });

// O motor é um módulo único, compartilhado pelo editor e pelo jogo (import map "meumotor").
const engine = {
  entryPoints: ["packages/engine/src/index.ts"],
  bundle: true, format: "esm", target: "es2022", sourcemap: true,
  outfile: `${dist}/engine/index.js`,
};
const editor = {
  entryPoints: ["packages/editor/src/main.ts"],
  bundle: true, format: "esm", target: "es2022", sourcemap: true,
  external: ["meumotor"],
  outfile: `${dist}/editor/main.js`,
};
const cli = {
  entryPoints: ["packages/cli/src/index.ts"],
  bundle: true, platform: "node", format: "esm", target: "node18",
  external: ["esbuild"], // dependência instalada junto com o pacote global
  outfile: `${dist}/cli.js`,
  banner: { js: "#!/usr/bin/env node" },
};

if (watch) {
  copyStatic(); buildTypes();
  const ctxs = await Promise.all([context(engine), context(editor), context(cli)]);
  await Promise.all(ctxs.map((c) => c.watch()));
  console.log("Observando alterações… (Ctrl+C para sair)");
} else {
  await Promise.all([build(engine), build(editor), build(cli)]);
  copyStatic(); buildTypes();
  chmodSync(`${dist}/cli.js`, 0o755);
  console.log("Build concluído.");
}
