import { createServer, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import { extname, isAbsolute, join, relative } from "node:path";
import { build, formatMessages } from "esbuild";
import { distDir, readProject } from "./project";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

type Bundle = { ok: true; code: string } | { ok: false; error: string };

async function sendFile(res: ServerResponse, root: string, rel: string): Promise<void> {
  const file = join(root, rel);
  const back = relative(root, file);
  if (back.startsWith("..") || isAbsolute(back)) {
    res.writeHead(403).end("Acesso negado");
    return;
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, {
      "content-type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404).end("Não encontrado");
  }
}

export function startServer(dir: string, port: number, onReady: (url: string) => void): void {
  const clients = new Set<ServerResponse>();
  let cached: Bundle | null = null;

  /** Compila o código de gameplay do projeto; "meumotor" fica externo (vem do motor global). */
  async function bundleProject(): Promise<Bundle> {
    if (cached) return cached;
    try {
      const cfg = await readProject(dir);
      if (!cfg) throw new Error("game.json não encontrado.");
      const out = await build({
        entryPoints: [join(dir, cfg.entry)],
        absWorkingDir: dir,
        bundle: true,
        format: "esm",
        target: "es2022",
        external: ["meumotor"],
        sourcemap: "inline",
        write: false,
        logLevel: "silent",
      });
      cached = { ok: true, code: out.outputFiles[0]!.text };
    } catch (e) {
      const errors = (e as { errors?: Parameters<typeof formatMessages>[0] }).errors;
      const error = errors?.length
        ? (await formatMessages(errors, { kind: "error" })).join("\n")
        : (e as Error).message;
      cached = { ok: false, error };
    }
    return cached;
  }

  const server = createServer(async (req, res) => {
    let path: string;
    try {
      path = decodeURIComponent((req.url ?? "/").split("?")[0]!);
    } catch {
      res.writeHead(400).end("Requisição inválida");
      return;
    }

    if (path === "/api/project") {
      try {
        const cfg = await readProject(dir);
        res.writeHead(cfg ? 200 : 404, { "content-type": MIME[".json"]! });
        res.end(JSON.stringify(cfg ? { ...cfg, dir } : { error: "game.json não encontrado" }));
      } catch (e) {
        res.writeHead(500).end((e as Error).message);
      }
      return;
    }
    if (path === "/__events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
      res.write(": ok\n\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }
    if (path === "/__project/main.js") {
      const b = await bundleProject();
      res.writeHead(b.ok ? 200 : 500, {
        "content-type": b.ok ? MIME[".js"]! : MIME[".txt"]!,
        "cache-control": "no-store",
      });
      res.end(b.ok ? b.code : b.error);
      return;
    }
    if (path.startsWith("/__engine/")) return sendFile(res, join(distDir, "engine"), path.slice(10));
    if (path.startsWith("/assets/")) return sendFile(res, join(dir, "assets"), path.slice(8));
    return sendFile(res, join(distDir, "editor"), path === "/" ? "index.html" : path.slice(1));
  });

  // Recarga automática ao salvar arquivos do projeto.
  let timer: NodeJS.Timeout | undefined;
  try {
    const w = watch(dir, { recursive: true }, (_evt, name) => {
      if (name && /(^|[\\/])(\.meumotor|node_modules|\.git)([\\/]|$)/.test(String(name))) return;
      cached = null;
      clearTimeout(timer);
      timer = setTimeout(() => { for (const c of clients) c.write("data: reload\n\n"); }, 80);
    });
    w.on("error", () => {});
  } catch {
    console.log("Aviso: recarga automática indisponível neste sistema.");
  }

  const listen = (p: number, attempts = 20) => {
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && attempts > 0) listen(p + 1, attempts - 1);
      else throw err;
    });
    server.listen(p, "127.0.0.1", () => onReady(`http://localhost:${p}`));
  };
  listen(port);
}
