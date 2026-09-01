import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

/** yt-dlp dropped CPython 3.10 (EOL). Need 3.11+. */
export const MIN_PYTHON = 311;

const versionCache = new Map<string, number>();

export function pythonVersionCode(bin: string): number {
  const hit = versionCache.get(bin);
  if (hit != null) return hit;
  const result = spawnSync(
    bin,
    ["-c", "import sys;print(sys.version_info.major*100+sys.version_info.minor)"],
    { encoding: "utf8", timeout: 4_000 },
  );
  const code = result.status === 0 ? Number.parseInt((result.stdout || "").trim(), 10) || 0 : 0;
  versionCache.set(bin, code);
  return code;
}

export function pythonBin(): string {
  const candidates = [
    process.env.OCTAVA_PYTHON,
    path.join(process.cwd(), ".runtime/python"),
    "/usr/bin/python3.14",
    "/usr/bin/python3.13",
    "/usr/bin/python3.12",
    "/usr/bin/python3.11",
    "/usr/local/bin/python3",
    "/usr/bin/python3",
    "python3",
  ].filter((bin): bin is string => Boolean(bin));

  for (const bin of candidates) {
    if ((bin.startsWith("/") || bin.startsWith(".")) && !existsSync(bin)) continue;
    if (pythonVersionCode(bin) >= MIN_PYTHON) return bin;
  }
  return candidates.find((bin) => existsSync(bin) || !bin.startsWith("/")) || "python3";
}
