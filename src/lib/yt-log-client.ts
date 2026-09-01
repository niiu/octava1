import type { YtLogLevel, YtLogLine } from "./media";

const MAX = 180;
const listeners = new Set<() => void>();

let lines: YtLogLine[] = [];
let localSeq = 0;
let downloadRatio = 0;

function emit() {
  for (const fn of listeners) fn();
}

export function getYtLines(): YtLogLine[] {
  return lines;
}

export function getYtDownloadRatio(): number {
  return downloadRatio;
}

export function setYtDownloadRatio(n: number | null | undefined): void {
  const next = n == null || !Number.isFinite(n) ? 0 : Math.max(0, Math.min(1, n));
  if (Math.abs(next - downloadRatio) < 0.004) return;
  downloadRatio = next;
  emit();
}

export function resetYtDownloadRatio(): void {
  if (downloadRatio === 0) return;
  downloadRatio = 0;
  emit();
}

export function subscribeYtLog(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function seenRecently(text: string): boolean {
  return lines.slice(-24).some((line) => line.text === text);
}

const DOWNLOAD_PCT = /\[download\]\s+(\d+(?:\.\d+)?)%/;

function ratioFromText(text: string): number | null {
  const match = text.match(DOWNLOAD_PCT);
  if (match) return Math.max(0, Math.min(Number(match[1]) / 100, 1));
  if (/скачивание\s/i.test(text)) return 0;
  if (/готово\s|Destination:|ExtractAudio/i.test(text)) return Math.max(downloadRatio, 0.92);
  return null;
}

export function noteYt(level: YtLogLevel, text: string): void {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed || seenRecently(trimmed)) return;
  const fromText = ratioFromText(trimmed);
  if (fromText != null) setYtDownloadRatio(fromText);
  localSeq += 1;
  lines = [...lines, { id: -localSeq, t: Date.now(), level, text: trimmed.slice(0, 500) }];
  if (lines.length > MAX) lines = lines.slice(-MAX);
  emit();
}

export function mergeYtServer(incoming: YtLogLine[] | undefined | null): void {
  if (!incoming || incoming.length === 0) return;
  const seen = new Set(lines.filter((l) => l.id > 0).map((l) => l.id));
  const add = incoming.filter((l) => l.id > 0 && !seen.has(l.id) && !seenRecently(l.text));
  if (add.length === 0) return;
  for (const line of add) {
    const fromText = ratioFromText(line.text);
    if (fromText != null) downloadRatio = fromText;
  }
  lines = [...lines, ...add].sort((a, b) => a.t - b.t || a.id - b.id);
  if (lines.length > MAX) lines = lines.slice(-MAX);
  emit();
}

export function ingestYtText(raw: string | undefined, level: YtLogLevel = "info"): void {
  if (!raw?.trim()) return;
  for (const row of raw.split(/\r?\n/)) {
    const text = row.trim();
    if (!text) continue;
    const lv = /ERROR:|HTTP Error\s+4/i.test(text)
      ? "error"
      : /WARNING:/i.test(text)
        ? "warn"
        : level;
    noteYt(lv, text);
  }
}

export function serverCursor(): number {
  let max = 0;
  for (const line of lines) {
    if (line.id > max) max = line.id;
  }
  return max;
}

export function clearYtLogLocal(): void {
  lines = [];
  downloadRatio = 0;
  emit();
}
