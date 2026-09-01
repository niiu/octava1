import type { YtLogLevel, YtLogLine } from "./media";

const MAX_LINES = 180;
const MAX_LINE = 500;

type ProgressSink = (ratio: number) => void;

type YtLogRt = {
  seq: number;
  lines: YtLogLine[];
  lastProgress: number;
  lastProgressBucket: number;
  progressEpoch: number;
  sink: ProgressSink | null;
};

function rt(): YtLogRt {
  const g = globalThis as typeof globalThis & { __octavaYtLog?: YtLogRt };
  if (!g.__octavaYtLog) {
    g.__octavaYtLog = {
      seq: 0,
      lines: [],
      lastProgress: 0,
      lastProgressBucket: -1,
      progressEpoch: 0,
      sink: null,
    };
  }
  return g.__octavaYtLog;
}

const DOWNLOAD_PCT = /\[download\]\s+(\d+(?:\.\d+)?)%/;
const OCTAVA_P =
  /\[octava-p\]\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*(.*)$/;
const FRAGMENT = /(?:Downloading fragment|Fragment)\s+(\d+)\s*(?:\/|of)\s*(\d+)/i;

const RELOAD_LINE =
  /please reload|reload this page|reload the page|needs to be reloaded|page needs to be reload/i;
const BOT_LINE = /sign in to confirm|not a bot/i;
const NO_FORMAT_LINE = /requested format is not available/i;

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
      if (yt && (BOT_LINE.test(line) || RELOAD_LINE.test(line) || NO_FORMAT_LINE.test(line))) {
        const prefix = yt[1] ?? "";
        if (BOT_LINE.test(line)) {
          return `${prefix}YouTube просит cookies входа (проверка на бота)`;
        }
        if (NO_FORMAT_LINE.test(line)) {
          return `${prefix}нет подходящего аудиоформата — пробуем другой`;
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

function toNum(raw: string | undefined): number | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t || /^NA|N\/A|None|nan$/i.test(t)) return null;
  const n = Number(t.replace(/%/g, ""));
  return Number.isFinite(n) ? n : null;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function parseDownloadRatio(text: string): number | null {
  const tagged = text.match(OCTAVA_P);
  if (tagged) {
    const downloaded = toNum(tagged[1]);
    const total = toNum(tagged[2]);
    const estimate = toNum(tagged[3]);
    const fragI = toNum(tagged[4]);
    const fragN = toNum(tagged[5]);
    const tail = (tagged[6] ?? "").trim();
    const pctMatch = tail.match(/(\d+(?:\.\d+)?)\s*%/);
    if (pctMatch) return clamp01(Number(pctMatch[1]) / 100);
    const pctBare = toNum(tail);
    if (pctBare != null) return clamp01(pctBare > 1.0001 ? pctBare / 100 : pctBare);
    if (fragI != null && fragN != null && fragN > 0) return clamp01(fragI / fragN);
    const denom = total ?? estimate;
    if (downloaded != null && denom != null && denom > 0) return clamp01(downloaded / denom);
  }
  const classic = text.match(DOWNLOAD_PCT);
  if (classic) return clamp01(Number(classic[1]) / 100);
  const frag = text.match(FRAGMENT);
  if (frag) {
    const n = Number(frag[2]);
    if (n > 0) return clamp01(Number(frag[1]) / n);
  }
  return null;
}

export function getDownloadProgress(): number {
  return rt().lastProgress;
}

export function getProgressEpoch(): number {
  return rt().progressEpoch;
}

export function setProgressSink(fn: ProgressSink | null): void {
  rt().sink = fn;
}

export function resetDownloadProgress(): void {
  const s = rt();
  s.lastProgress = 0;
  s.lastProgressBucket = -1;
  s.progressEpoch += 1;
  s.sink?.(0);
}

function emitProgress(ratio: number): void {
  const s = rt();
  const next = clamp01(ratio);
  if (next + 0.002 < s.lastProgress && next < 0.99) return;
  s.lastProgress = Math.max(s.lastProgress, next);
  s.sink?.(s.lastProgress);
}

function applyDownloadProgress(text: string): boolean {
  const parsed = parseDownloadRatio(text);
  if (parsed != null) {
    const s = rt();
    const before = s.lastProgress;
    emitProgress(parsed);
    const bucket = Math.floor(s.lastProgress * 50);
    if (bucket === s.lastProgressBucket && s.lastProgress < 1 && s.lastProgress === before) {
      return true;
    }
    if (bucket === s.lastProgressBucket && s.lastProgress < 1) return true;
    s.lastProgressBucket = bucket;
    return false;
  }
  if (/скачивание\s/i.test(text)) {
    emitProgress(0.03);
    return false;
  }
  if (/Destination:|ExtractAudio|has already been downloaded/i.test(text)) {
    emitProgress(Math.max(rt().lastProgress, 0.92));
    return false;
  }
  if (/готово\s/i.test(text)) {
    emitProgress(1);
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
  const s = rt();
  s.seq += 1;
  s.lines.push({ id: s.seq, t: Date.now(), level, text });
  if (s.lines.length > MAX_LINES) s.lines.splice(0, s.lines.length - MAX_LINES);
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
  const lines = rt().lines;
  if (after <= 0) return lines.slice();
  return lines.filter((line) => line.id > after);
}

export function dumpLogText(limit = 40): string {
  return rt()
    .lines.slice(-limit)
    .map((line) => line.text)
    .join("\n");
}

export function clearLog(): void {
  const s = rt();
  s.lines.length = 0;
  resetDownloadProgress();
}
