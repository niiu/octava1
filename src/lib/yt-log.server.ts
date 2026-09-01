import type { YtLogLevel, YtLogLine } from "./media";

const MAX_LINES = 180;
const MAX_LINE = 500;

let seq = 0;
const lines: YtLogLine[] = [];
let lastProgress = 0;
let lastProgressBucket = -1;

const DOWNLOAD_PCT = /\[download\]\s+(\d+(?:\.\d+)?)%/;

const RELOAD_LINE =
  /please reload|reload this page|reload the page|needs to be reloaded|page needs to be reload/i;
const BOT_LINE = /sign in to confirm|not a bot/i;

export function sanitizeLog(raw: string): string {
  return humanizeYtLog(
    raw
      .replace(/\u001b\[[0-9;]*m/g, "")
      .replace(
        /\b(SID|HSID|SSID|APISID|SAPISID|__Secure-[A-Za-z0-9_-]+|LOGIN_INFO|VISITOR_INFO1_LIVE|YSC|PREF|CONSENT|SESSION_TOKEN)=[^\s;]*/gi,
        "$1=***",
      )
      .replace(/#HttpOnly_[^\n]*/g, "#HttpOnly_***")
      .replace(/Cookie:\s*[^\n]+/gi, "Cookie: ***")
      .replace(/--cookies(?:-from-browser)?\s+\S+/gi, "--cookies ***"),
  );
}

function humanizeYtLog(raw: string): string {
  return raw
    .split(/\r?\n/)
    .map((line) => {
      const yt = line.match(/^(ERROR:\s*\[youtube\]\s*\S+:\s*)([\s\S]*)$/i);
      if (yt && (BOT_LINE.test(line) || RELOAD_LINE.test(line))) {
        const prefix = yt[1] ?? "";
        if (BOT_LINE.test(line)) {
          return `${prefix}YouTube просит cookies входа (проверка на бота)`;
        }
        return `${prefix}сессия cookies сброшена — загрузите свежий cookies.txt`;
      }
      if (BOT_LINE.test(line)) {
        return "YouTube просит cookies входа (проверка на бота)";
      }
      if (RELOAD_LINE.test(line)) {
        return line
          .replace(/The page needs to be reloaded\.?/gi, "сессия cookies сброшена")
          .replace(/Please reload this page\.?/gi, "обновите cookies YouTube")
          .replace(/reload the page\.?/gi, "обновите cookies YouTube");
      }
      return line;
    })
    .join("\n");
}

function classify(text: string): YtLogLevel {
  if (/ERROR:/i.test(text) || /HTTP Error\s+4\d\d/i.test(text)) return "error";
  if (/WARNING:/i.test(text) || /Deprecated Feature/i.test(text)) return "warn";
  if (/Destination:|has already been downloaded/i.test(text)) return "ok";
  return "info";
}

export function getDownloadProgress(): number {
  return lastProgress;
}

function resetProgress() {
  lastProgress = 0;
  lastProgressBucket = -1;
}

function applyDownloadProgress(text: string): boolean {
  const match = text.match(DOWNLOAD_PCT);
  if (match) {
    const pct = Math.max(0, Math.min(Number(match[1]) / 100, 1));
    lastProgress = pct;
    const bucket = Math.floor(pct * 20);
    if (bucket === lastProgressBucket && pct < 1) return true;
    lastProgressBucket = bucket;
    return false;
  }
  if (/скачивание\s/i.test(text)) {
    resetProgress();
    return false;
  }
  if (/Destination:|ExtractAudio|has already been downloaded/i.test(text)) {
    lastProgress = Math.max(lastProgress, 0.92);
  }
  if (/готово\s/i.test(text)) {
    lastProgress = 1;
  }
  return false;
}

export function appendLog(
  level: YtLogLevel,
  raw: string,
  opts?: { skipProgress?: boolean },
): void {
  const text = sanitizeLog(raw).replace(/\s+/g, " ").trim().slice(0, MAX_LINE);
  if (!text) return;
  if (!opts?.skipProgress && applyDownloadProgress(text) && level === "info") return;
  seq += 1;
  lines.push({ id: seq, t: Date.now(), level, text });
  if (lines.length > MAX_LINES) lines.splice(0, lines.length - MAX_LINES);
}

export function feedLogChunk(chunk: string, carry: { buf: string }): void {
  const parts = (carry.buf + chunk).split(/\r?\n|\r/);
  carry.buf = parts.pop() ?? "";
  for (const part of parts) {
    const text = sanitizeLog(part).trim();
    if (!text) continue;
    const swallowed = applyDownloadProgress(text);
    if (swallowed && !/ERROR:|WARNING:/i.test(text)) continue;
    appendLog(classify(text), text, { skipProgress: true });
  }
}

export function flushLogCarry(carry: { buf: string }): void {
  const text = sanitizeLog(carry.buf).trim();
  carry.buf = "";
  if (text) appendLog(classify(text), text);
}

export function listLog(after = 0): YtLogLine[] {
  if (after <= 0) return lines.slice();
  return lines.filter((line) => line.id > after);
}

export function dumpLogText(limit = 40): string {
  return lines
    .slice(-limit)
    .map((line) => line.text)
    .join("\n");
}

export function clearLog(): void {
  lines.length = 0;
  resetProgress();
}
