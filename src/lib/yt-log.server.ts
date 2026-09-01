import type { YtLogLevel, YtLogLine } from "./media";

const MAX_LINES = 180;
const MAX_LINE = 500;

type ProgressSink = (ratio: number) => void;

type YtLogRt = {
  ver: number;
  boot: number;
  seq: number;
  lines: YtLogLine[];
  lastProgress: number;
  lastProgressBucket: number;
  progressEpoch: number;
  sink: ProgressSink | null;
  currentTitle: string;
  expectEncode: boolean;
  mediaDuration: number;
  lastConsolePct: number;
  lastConsoleKind: string;
  lastConsoleAt: number;
};

const LOG_VER = 2;

function rt(): YtLogRt {
  const g = globalThis as typeof globalThis & { __octavaYtLog?: YtLogRt };
  if (!g.__octavaYtLog || g.__octavaYtLog.ver !== LOG_VER) {
    g.__octavaYtLog = {
      ver: LOG_VER,
      boot: Date.now(),
      seq: 0,
      lines: [],
      lastProgress: 0,
      lastProgressBucket: -1,
      progressEpoch: 0,
      sink: null,
      currentTitle: "",
      expectEncode: false,
      mediaDuration: 0,
      lastConsolePct: -1,
      lastConsoleKind: "",
      lastConsoleAt: 0,
    };
  }
  return g.__octavaYtLog;
}

const DOWNLOAD_PCT = /\[download\]\s+(\d+(?:\.\d+)?)%/;
const OCTAVA_P =
  /\[octava-p\]\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*(.*)$/;
const FRAGMENT = /(?:Downloading fragment|Fragment)\s+(\d+)\s*(?:\/|of)\s*(\d+)/i;
const DURATION_HMS = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i;
const TIME_HMS = /(?:out_time|time)=\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i;
const OUT_TIME_US = /out_time_us=(\d+)/;
const OUT_TIME_MS = /out_time_ms=(\d+)/;
const PRINT_DURATION = /^duration:(\d+(?:\.\d+)?)\s*$/i;
const PRINT_TITLE = /^title:(.+)$/i;
const FFMPEG_KV =
  /^(?:frame|fps|stream_\d+|bitrate|total_size|out_time(?:_ms|_us)?|dup_frames|drop_frames|speed|progress|n|packet)=/i;

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
  if (/готово\s|сейчас\s|кодирование|загрузка\s+\d/i.test(text)) return "ok";
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

function hmsToSec(h: string, m: string, s: string): number {
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

function who(): string {
  const title = rt().currentTitle.trim();
  return title ? `«${title}»` : "файл";
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

function parseEncodeRatio(text: string): number | null {
  const duration = rt().mediaDuration;
  if (duration <= 0) return null;
  const hms = text.match(TIME_HMS);
  if (hms) return clamp01(hmsToSec(hms[1]!, hms[2]!, hms[3]!) / duration);
  const us = text.match(OUT_TIME_US);
  if (us) return clamp01(Number(us[1]) / 1_000_000 / duration);
  const ms = text.match(OUT_TIME_MS);
  if (ms) {
    const n = Number(ms[1]);
    const asMs = n / 1000 / duration;
    const asUs = n / 1_000_000 / duration;
    if (asMs > 1.5 && asUs <= 1.2) return clamp01(asUs);
    return clamp01(asMs);
  }
  return null;
}

function noteDuration(text: string): void {
  const printed = text.match(PRINT_DURATION);
  if (printed) {
    const sec = Number(printed[1]);
    if (sec > 0) rt().mediaDuration = sec;
    return;
  }
  const hms = text.match(DURATION_HMS);
  if (hms) {
    const sec = hmsToSec(hms[1]!, hms[2]!, hms[3]!);
    if (sec > 0) rt().mediaDuration = sec;
  }
}

export function getDownloadProgress(): number {
  return rt().lastProgress;
}

export function getProgressEpoch(): number {
  return rt().progressEpoch;
}

export function getLogBoot(): number {
  return rt().boot;
}

export function setProgressSink(fn: ProgressSink | null): void {
  rt().sink = fn;
}

export function resetDownloadProgress(): void {
  const s = rt();
  s.lastProgress = 0;
  s.lastProgressBucket = -1;
  s.progressEpoch += 1;
  s.lastConsolePct = -1;
  s.lastConsoleKind = "";
  s.lastConsoleAt = 0;
  s.sink?.(0);
}

export function beginExtractLog(info: {
  videoId: string;
  title?: string;
  format: string;
  quality?: string;
  duration?: number | null;
  encode: boolean;
}): void {
  const s = rt();
  s.currentTitle = (info.title || info.videoId).trim();
  s.expectEncode = info.encode;
  s.mediaDuration = info.duration && info.duration > 0 ? info.duration : 0;
  resetDownloadProgress();
  const how =
    info.encode && info.format === "mp3"
      ? `mp3 ${info.quality || "192"}k`
      : info.format;
  pushLine("ok", `сейчас ${who()} · ${how}`);
}

function emitProgress(ratio: number): void {
  const s = rt();
  const next = clamp01(ratio);
  if (next + 0.002 < s.lastProgress && next < 0.99) return;
  s.lastProgress = Math.max(s.lastProgress, next);
  s.sink?.(s.lastProgress);
}

function pushLine(level: YtLogLevel, text: string): void {
  const s = rt();
  s.seq += 1;
  s.lines.push({ id: s.seq, t: Date.now(), level, text: text.slice(0, MAX_LINE) });
  if (s.lines.length > MAX_LINES) s.lines.splice(0, s.lines.length - MAX_LINES);
}

function maybeLogPct(kind: "загрузка" | "кодирование", phaseRatio: number): void {
  const pct = Math.max(0, Math.min(100, Math.round(phaseRatio * 100)));
  const s = rt();
  const now = Date.now();
  const sameKind = s.lastConsoleKind === kind;
  if (sameKind && pct === s.lastConsolePct) return;
  const jumped = !sameKind || Math.abs(pct - s.lastConsolePct) >= 5;
  const aged = now - s.lastConsoleAt >= 1500;
  if (pct < 100 && !jumped && !aged) return;
  s.lastConsolePct = pct;
  s.lastConsoleKind = kind;
  s.lastConsoleAt = now;
  pushLine("info", `${who()} · ${kind} ${pct}%`);
}

function mapDownloadRatio(download01: number): number {
  if (!rt().expectEncode) return download01 >= 0.995 ? 1 : download01;
  if (download01 >= 0.995) return Math.max(rt().lastProgress, 0.85);
  return download01 * 0.85;
}

function applyDownloadProgress(text: string): boolean {
  noteDuration(text);
  const titlePrint = text.match(PRINT_TITLE);
  if (titlePrint) {
    const next = titlePrint[1]?.trim();
    if (next && !rt().currentTitle) rt().currentTitle = next;
  }

  const parsed = parseDownloadRatio(text);
  if (parsed != null) {
    const mapped = mapDownloadRatio(parsed);
    emitProgress(mapped);
    maybeLogPct("загрузка", parsed);
    return true;
  }

  const encoded = parseEncodeRatio(text);
  if (encoded != null) {
    emitProgress(0.85 + 0.14 * encoded);
    maybeLogPct("кодирование", encoded);
    return true;
  }

  if (/^progress=end/i.test(text)) {
    if (rt().expectEncode) emitProgress(Math.max(rt().lastProgress, 0.99));
    maybeLogPct("кодирование", 1);
    return true;
  }

  if (/скачивание\s|сейчас\s/i.test(text)) {
    emitProgress(Math.max(rt().lastProgress, 0.03));
    return false;
  }
  if (/\[ExtractAudio\]|ExtractAudio/i.test(text)) {
    emitProgress(Math.max(rt().lastProgress, 0.85));
    const s = rt();
    if (s.lastConsoleKind !== "кодирование") {
      s.lastConsoleKind = "кодирование";
      s.lastConsolePct = 0;
      s.lastConsoleAt = Date.now();
      pushLine("info", `${who()} · кодирование…`);
    }
    return true;
  }
  if (/готово\s/i.test(text)) {
    emitProgress(1);
    return false;
  }
  return false;
}

function isNoisy(text: string): boolean {
  if (FFMPEG_KV.test(text)) return true;
  if (PRINT_DURATION.test(text) || PRINT_TITLE.test(text)) return true;
  if (/^Deleting original file/i.test(text)) return true;
  if (/^\[debug\]/i.test(text)) return true;
  if (/^\[youtube\]/i.test(text) && !/ERROR|WARNING/i.test(text)) return true;
  if (/^\[info\]/i.test(text) && /Downloading \d+ format/i.test(text)) return true;
  if (/^\[download\] Destination:/i.test(text)) return true;
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
  if (isNoisy(text) && level === "info") return;
  pushLine(level, text);
}

export function feedLogChunk(chunk: string, carry: { buf: string }): void {
  const parts = (carry.buf + chunk).split(/\r?\n|\r/);
  carry.buf = parts.pop() ?? "";
  for (const part of parts) {
    const text = sanitizeLog(part).trim();
    if (!text) continue;
    const swallowed = applyDownloadProgress(text);
    if (swallowed && !/ERROR:|WARNING:/i.test(text)) continue;
    if (isNoisy(text) && !/ERROR:|WARNING:/i.test(text)) continue;
    appendLog(classify(text), text, { skipProgress: true });
  }
}

export function flushLogCarry(carry: { buf: string }): void {
  const text = sanitizeLog(carry.buf).trim();
  carry.buf = "";
  if (text) appendLog(classify(text), text);
}

export function listLog(after = 0): YtLogLine[] {
  const s = rt();
  const lines = s.lines;
  if (after <= 0) return lines.slice();
  if (after > s.seq) return lines.slice(-80);
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
  s.currentTitle = "";
  resetDownloadProgress();
}
