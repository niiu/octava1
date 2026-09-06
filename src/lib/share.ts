import type { LocalPlaylist, Track } from "./media";
import { watchUrl } from "./media";
import { isVideoId } from "./youtube-url";

export type SharePayload = {
  v: 1;
  n: string;
  t: Array<{ i: string; l?: string; c?: string; d?: number | null }>;
};

const PREFIX = "o1.";

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(raw: string): Uint8Array {
  const pad = raw.length % 4 === 0 ? "" : "=".repeat(4 - (raw.length % 4));
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeShare(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return PREFIX + toBase64Url(new TextEncoder().encode(json));
}

export function decodeShare(raw: string): SharePayload | null {
  const text = raw.trim();
  if (!text.startsWith(PREFIX)) return null;
  try {
    const json = new TextDecoder().decode(fromBase64Url(text.slice(PREFIX.length)));
    const parsed = JSON.parse(json) as SharePayload;
    if (parsed?.v !== 1 || typeof parsed.n !== "string" || !Array.isArray(parsed.t)) return null;
    const tracks = parsed.t
      .map((row) => ({
        i: typeof row.i === "string" ? row.i : "",
        l: typeof row.l === "string" ? row.l : undefined,
        c: typeof row.c === "string" ? row.c : undefined,
        d: typeof row.d === "number" ? row.d : null,
      }))
      .filter((row) => isVideoId(row.i))
      .slice(0, 40);
    if (tracks.length === 0) return null;
    return { v: 1, n: parsed.n.trim().slice(0, 80) || "Подборка", t: tracks };
  } catch {
    return null;
  }
}

export function playlistToShare(pl: LocalPlaylist, catalog: Record<string, Track>): SharePayload {
  const tracks = pl.trackIds
    .map((id) => catalog[id])
    .filter((t): t is Track => Boolean(t))
    .slice(0, 40)
    .map((t) => ({
      i: t.id,
      l: t.title.slice(0, 80),
      c: t.channel.slice(0, 40),
      d: t.duration,
    }));
  return { v: 1, n: pl.name.slice(0, 80) || "Подборка", t: tracks };
}

export function shareTracks(payload: SharePayload): Track[] {
  return payload.t.map((row) => ({
    id: row.i,
    title: row.l?.trim() || row.i,
    channel: row.c?.trim() || "YouTube",
    duration: row.d ?? null,
    thumbnail: `https://i.ytimg.com/vi/${row.i}/hqdefault.jpg`,
    url: watchUrl(row.i),
    filesize: null,
  }));
}

export function sharePageUrl(token: string): string {
  if (typeof window === "undefined") return `/?p=${encodeURIComponent(token)}`;
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("p", token);
  return url.toString();
}

export function youtubeListText(payload: SharePayload): string {
  const lines = [`${payload.n}`, ""];
  for (const row of payload.t) {
    const title = row.l?.trim();
    lines.push(title ? `${title}` : "");
    lines.push(watchUrl(row.i));
  }
  return lines.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
}

export function readShareParam(search: string): string | null {
  try {
    const value = new URLSearchParams(search).get("p");
    return value?.trim() || null;
  } catch {
    return null;
  }
}
