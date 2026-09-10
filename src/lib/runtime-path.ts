import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

export function runtimeDir(): string {
  return path.join(process.cwd(), ".runtime");
}

export function extraBinDirs(): string[] {
  const root = process.cwd();
  const win = process.platform === "win32";
  return [
    path.join(root, "bin"),
    path.join(root, ".runtime", "node"),
    path.join(root, ".runtime", "ffmpeg", "bin"),
    path.join(root, ".runtime", "ffmpeg"),
    path.join(root, ".runtime", "python"),
    path.join(root, ".runtime", "python", "Scripts"),
    win ? path.join(process.env.LOCALAPPDATA ?? "", "Programs", "Python", "Python312") : "",
    win ? path.join(process.env.LOCALAPPDATA ?? "", "Programs", "Python", "Python313") : "",
  ].filter((dir) => dir && existsSync(dir));
}

export function withRuntimePath(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const prefix = extraBinDirs().join(path.delimiter);
  const next = prefix ? `${prefix}${path.delimiter}${env.PATH ?? ""}` : (env.PATH ?? "");
  return { ...env, PATH: next };
}

function firstExisting(files: Array<string | undefined | null>): string | null {
  for (const file of files) {
    if (file && existsSync(file)) return file;
  }
  return null;
}

export function ffmpegBin(): string | null {
  const win = process.platform === "win32";
  const name = win ? "ffmpeg.exe" : "ffmpeg";
  const found = firstExisting([
    process.env.FFMPEG_PATH,
    path.join(process.cwd(), ".runtime", "ffmpeg", "bin", name),
    path.join(process.cwd(), ".runtime", "ffmpeg", name),
    path.join(process.cwd(), "bin", name),
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
  ]);
  if (found) return found;
  const probe = spawnSync(name, ["-version"], {
    env: withRuntimePath(),
    encoding: "utf8",
    timeout: 4_000,
    windowsHide: true,
  });
  if (probe.status === 0) return name;
  return null;
}

export function ytDlpCandidates(): string[] {
  const root = process.cwd();
  const win = process.platform === "win32";
  return [
    process.env.YT_DLP_PATH,
    win ? path.join(root, "bin", "yt-dlp.exe") : "",
    path.join(root, "bin", "yt-dlp"),
    "/workspace/bin/yt-dlp",
  ].filter((p): p is string => Boolean(p));
}
