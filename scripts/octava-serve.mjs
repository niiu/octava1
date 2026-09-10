#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const win = process.platform === "win32";
const extras = [
  path.join(root, ".runtime", "node"),
  path.join(root, ".runtime", "ffmpeg", "bin"),
  path.join(root, ".runtime", "ffmpeg"),
  path.join(root, "bin"),
  path.join(root, ".runtime", "python"),
  path.join(root, ".runtime", "python", "Scripts"),
].filter((dir) => existsSync(dir));
process.env.PATH = [...extras, process.env.PATH ?? ""].join(path.delimiter);

const ytdlpExe = path.join(root, "bin", "yt-dlp.exe");
const ytdlp = path.join(root, "bin", "yt-dlp");
process.env.YT_DLP_PATH ||= existsSync(ytdlpExe) ? ytdlpExe : ytdlp;

const pyExe = path.join(root, ".runtime", "python", win ? "python.exe" : "python");
const pyLink = path.join(root, ".runtime", "python");
if (!process.env.OCTAVA_PYTHON) {
  if (existsSync(pyExe)) process.env.OCTAVA_PYTHON = pyExe;
  else if (existsSync(pyLink)) process.env.OCTAVA_PYTHON = pyLink;
}

const ffmpeg = [
  path.join(root, ".runtime", "ffmpeg", "bin", win ? "ffmpeg.exe" : "ffmpeg"),
  path.join(root, ".runtime", "ffmpeg", win ? "ffmpeg.exe" : "ffmpeg"),
  path.join(root, "bin", win ? "ffmpeg.exe" : "ffmpeg"),
].find((file) => existsSync(file));
if (ffmpeg) process.env.FFMPEG_PATH ||= ffmpeg;

process.env.OCTAVA_HOME = root;
process.env.OCTAVA_HOST ||= "0.0.0.0";
process.env.NODE_ENV = "production";

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
  });
}

async function pickPort() {
  const preferred = Number.parseInt(process.env.OCTAVA_PORT || "8080", 10);
  const list = [preferred, 8088, 8787, 8888, 3000, 3001, 9090, 4173];
  for (let n = preferred + 1; n <= preferred + 40; n++) list.push(n);
  const seen = new Set();
  for (const port of list) {
    if (!Number.isInteger(port) || port < 1 || port > 65535 || seen.has(port)) continue;
    seen.add(port);
    if (await canListen(port)) return port;
  }
  throw new Error("Нет свободного TCP-порта для Octava.");
}

const port = String(await pickPort());
process.env.OCTAVA_PORT = port;
process.env.NITRO_HOST = process.env.OCTAVA_HOST;
process.env.NITRO_PORT = port;
process.env.HOST = process.env.OCTAVA_HOST;
process.env.PORT = port;

const runDir = path.join(root, ".run");
mkdirSync(runDir, { recursive: true });
writeFileSync(path.join(runDir, "octava.port"), port, "utf8");
console.log(`Octava http://127.0.0.1:${port}/`);

const vercel = path.join(root, ".vercel", "output", "functions", "__server.func", "index.mjs");
const nitro = path.join(root, ".output", "server", "index.mjs");
const entry = existsSync(vercel) ? vercel : existsSync(nitro) ? nitro : null;

if (entry) {
  await import(pathToFileURL(entry).href);
} else {
  const child = spawn(
    process.execPath,
    [
      path.join(root, "scripts", "with-app-env.mjs"),
      "vite",
      "preview",
      "--host",
      process.env.OCTAVA_HOST,
      "--port",
      port,
    ],
    { stdio: "inherit", cwd: root, env: process.env, windowsHide: false },
  );
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}
