import { Game, Scene } from "meumotor";

interface ProjectInfo { name: string; width: number; height: number; entry: string; dir: string }

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const info: ProjectInfo = await (await fetch("/api/project")).json();

const canvas = $<HTMLCanvasElement>("game");
const game = new Game(canvas, { width: info.width, height: info.height });
canvas.style.aspectRatio = `${game.width} / ${game.height}`;
canvas.style.width = `${game.width}px`;

$("project").textContent = info.name;
$("project").title = info.dir;
$("stat-size").textContent = `${game.width} × ${game.height}`;
document.title = `${info.name} — MeuMotor`;

const errorBox = $<HTMLPreElement>("error");
const showError = (msg: string) => { errorBox.textContent = msg; errorBox.hidden = false; };
const clearError = () => { errorBox.hidden = true; errorBox.textContent = ""; };

let started = false;

/** Compila (no servidor) e carrega o código de gameplay do projeto. */
async function load(): Promise<void> {
  try {
    const res = await fetch("/__project/main.js");
    if (!res.ok) { showError(await res.text()); return; }

    const mod = await import(/* webpackIgnore: true */ `/__project/main.js?v=${Date.now()}`);
    const SceneClass = mod.default;
    if (typeof SceneClass !== "function") {
      throw new Error(`${info.entry} precisa exportar uma classe de cena com "export default".`);
    }
    const scene = new SceneClass();
    if (!(scene instanceof Scene)) {
      throw new Error(`A classe exportada por ${info.entry} precisa estender Scene (importe de "meumotor").`);
    }
    await game.setScene(scene);
    clearError();
    $("stat-scene").textContent = SceneClass.name || "(sem nome)";
    if (!started) { game.play(); started = true; }
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e));
  }
}

const btnPlay = $<HTMLButtonElement>("btn-play");
btnPlay.addEventListener("click", () => {
  if (game.running) game.pause(); else game.play();
  btnPlay.textContent = game.running ? "Pausar" : "Continuar";
});
$("btn-restart").addEventListener("click", () => void game.restart());
setInterval(() => { $("stat-fps").textContent = game.running ? String(game.fps) : "pausado"; }, 250);

new EventSource("/__events").addEventListener("message", () => void load());
await load();
