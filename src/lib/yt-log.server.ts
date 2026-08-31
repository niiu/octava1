import type { YtLogLevel, YtLogLine } from "./media";

const MAX_LINES = 180;
const MAX_LINE = 500;

let seq = 0;
const lines: YtLogLine[] = [];

export function sanitizeLog(raw: string): string {
  return raw
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(
      /\b(SID|HSID|SSID|APISID|SAPISID|__Secure-[A-Za-z0-9_-]+|LOGIN_INFO|VISITOR_INFO1_LIVE|YSC|PREF|CONSENT|SESSION_TOKEN)=[^\s;]*/gi,
      "$1=***",
    )
    .replace(/#HttpOnly_[^\n]*/g, "#HttpOnly_***")
    .replace(/Cookie:\s*[^\n]+/gi, "Cookie: ***")
    .replace(/--cookies(?:-from-browser)?\s+\S+/gi, "--cookies ***");
}

function classify(text: string): YtLogLevel {
  if (/ERROR:/i.test(text) || /HTTP Error\s+4\d\d/i.test(text)) return "error";
  if (/WARNING:/i.test(text) || /Deprecated Feature/i.test(text)) return "warn";
  if (/100%|Destination:|has already been downloaded/i.test(text)) return "ok";
  return "info";
}

export function appendLog(level: YtLogLevel, raw: string): void {
  const text = sanitizeLog(raw).replace(/\s+/g, " ").trim().slice(0, MAX_LINE);
  if (!text) return;
  seq += 1;
  lines.push({ id: seq, t: Date.now(), level, text });
  if (lines.length > MAX_LINES) lines.splice(0, lines.length - MAX_LINES);
}

export function feedLogChunk(chunk: string, carry: { buf: string }): void {
  const parts = (carry.buf + chunk).split(/\r?\n|\r/);
  carry.buf = parts.pop() ?? "";
  for (const part of parts) {
    const text = sanitizeLog(part).trim();
    if (text) appendLog(classify(text), text);
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
}
