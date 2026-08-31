import { existsSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { countCookieRows, normalizeCookieFile } from "./cookie-file";

const execFileAsync = promisify(execFile);
const BROWSERS = ["chrome", "chromium", "firefox", "brave"] as const;

export type CookieStatus = {
  present: boolean;
  count: number;
};

function pythonBin(): string {
  if (existsSync("/usr/bin/python3.11")) return "/usr/bin/python3.11";
  if (existsSync("/usr/local/bin/python3")) return "/usr/local/bin/python3";
  return "python3";
}

function ytDlpPath(): string | null {
  const candidates = [
    process.env.YT_DLP_PATH,
    path.join(process.cwd(), "bin/yt-dlp"),
    "/workspace/bin/yt-dlp",
  ].filter((p): p is string => Boolean(p));
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function cookiesFilePath(): string {
  const env = process.env.YTDLP_COOKIES;
  if (env) return env;
  return path.join(process.cwd(), "cookies.txt");
}

export async function cookieStatus(): Promise<CookieStatus> {
  const file = cookiesFilePath();
  if (!existsSync(file)) return { present: false, count: 0 };
  try {
    const text = await readFile(file, "utf8");
    const count = countCookieRows(text);
    return { present: count > 0 || text.trim().length > 0, count };
  } catch {
    return { present: false, count: 0 };
  }
}

export async function saveCookieFile(raw: string): Promise<CookieStatus> {
  const normalized = normalizeCookieFile(raw);
  const count = countCookieRows(normalized);
  if (count === 0) {
    throw new Error("В файле нет cookie-записей");
  }
  const dest = cookiesFilePath();
  try {
    await writeFile(dest, normalized, { encoding: "utf8", mode: 0o600 });
  } catch {
    // Read-only deploy: the client still sends cookies per request.
  }
  return { present: true, count };
}

export async function clearCookieFile(): Promise<CookieStatus> {
  const dest = cookiesFilePath();
  if (existsSync(dest)) await unlink(dest).catch(() => {});
  return { present: false, count: 0 };
}

function profileDirs(browser: (typeof BROWSERS)[number]): string[] {
  const home = os.homedir();
  switch (browser) {
    case "chrome":
      return [
        path.join(home, ".config/google-chrome"),
        path.join(home, "Library/Application Support/Google/Chrome"),
        path.join(home, "AppData/Local/Google/Chrome/User Data"),
      ];
    case "chromium":
      return [
        path.join(home, ".config/chromium"),
        path.join(home, "Library/Application Support/Chromium"),
      ];
    case "firefox":
      return [
        path.join(home, ".mozilla/firefox"),
        path.join(home, "Library/Application Support/Firefox"),
        path.join(home, "AppData/Roaming/Mozilla/Firefox"),
      ];
    case "brave":
      return [
        path.join(home, ".config/BraveSoftware/Brave-Browser"),
        path.join(home, "Library/Application Support/BraveSoftware/Brave-Browser"),
        path.join(home, "AppData/Local/BraveSoftware/Brave-Browser/User Data"),
      ];
  }
}

function browsersWithProfile(): Array<(typeof BROWSERS)[number]> {
  return BROWSERS.filter((browser) => profileDirs(browser).some((dir) => existsSync(dir)));
}

export async function exportFromBrowser(): Promise<CookieStatus & { browser: string }> {
  const bin = ytDlpPath();
  if (!bin) {
    throw new Error("yt-dlp не установлен — откройте «Установка».");
  }
  const py = pythonBin();
  const available = browsersWithProfile();
  if (available.length === 0) {
    throw new Error(
      "На этой машине нет профиля Chrome / Firefox / Brave. Вставьте cookies.txt в поле.",
    );
  }
  const tmp = path.join(os.tmpdir(), `octava-browser-cookies-${process.pid}.txt`);

  for (const browser of available) {
    try {
      await execFileAsync(
        py,
        [
          bin,
          "--js-runtimes",
          "node",
          "--no-warnings",
          "--skip-download",
          "--ignore-no-formats-error",
          "--cookies-from-browser",
          browser,
          "--cookies",
          tmp,
          "https://www.youtube.com/",
        ],
        { timeout: 8_000, maxBuffer: 2 * 1024 * 1024 },
      );
      if (!existsSync(tmp)) continue;
      const text = await readFile(tmp, "utf8");
      await unlink(tmp).catch(() => {});
      const status = await saveCookieFile(text);
      return { ...status, browser };
    } catch {
      await unlink(tmp).catch(() => {});
    }
  }

  throw new Error(
    "Не удалось взять cookies из браузера на этой машине. Вставьте cookies.txt в поле.",
  );
}
