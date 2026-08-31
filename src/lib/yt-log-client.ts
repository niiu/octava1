import type { YtLogLevel, YtLogLine } from "./media";

const MAX = 180;
const listeners = new Set<() => void>();

let lines: YtLogLine[] = [];
let localSeq = 0;

function emit() {
  for (const fn of listeners) fn();
}

export function getYtLines(): YtLogLine[] {
  return lines;
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

export function noteYt(level: YtLogLevel, text: string): void {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed || seenRecently(trimmed)) return;
  localSeq += 1;
  lines = [...lines, { id: -localSeq, t: Date.now(), level, text: trimmed.slice(0, 500) }];
  if (lines.length > MAX) lines = lines.slice(-MAX);
  emit();
}

export function mergeYtServer(incoming: YtLogLine[]): void {
  if (incoming.length === 0) return;
  const seen = new Set(lines.filter((l) => l.id > 0).map((l) => l.id));
  const add = incoming.filter((l) => l.id > 0 && !seen.has(l.id) && !seenRecently(l.text));
  if (add.length === 0) return;
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
  emit();
}
