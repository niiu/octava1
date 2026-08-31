export type AudioFormat = "m4a" | "mp3" | "source";

export type Track = {
  id: string;
  title: string;
  channel: string;
  duration: number | null;
  thumbnail: string;
  url: string;
  filesize: number | null;
};

export type LocalPlaylist = {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
};

export type ResolveResult =
  | { kind: "video"; track: Track }
  | { kind: "playlist"; id: string; title: string; channel: string; tracks: Track[] }
  | { kind: "search"; query: string; tracks: Track[] };

export type YtLogLevel = "info" | "warn" | "error" | "ok";

export type YtLogLine = {
  id: number;
  t: number;
  level: YtLogLevel;
  text: string;
};

export type ExtractorCaps = {
  ytdlp: boolean;
  ffmpeg: boolean;
  python: string | null;
  cookies: boolean;
  cookieCount: number;
};

export const FORMAT_LABEL: Record<AudioFormat, string> = {
  m4a: "M4A",
  mp3: "MP3",
  source: "как есть",
};

export function formatDuration(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return "—";
  const total = Math.round(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function thumbFor(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function watchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function safeFilename(name: string, max = 96): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const sliced = cleaned.slice(0, max).trim() || "audio";
  return sliced.replace(/[. ]+$/g, "") || "audio";
}

export function extensionFor(format: AudioFormat, mime?: string): string {
  if (format === "mp3") return "mp3";
  if (format === "m4a") return "m4a";
  if (mime?.includes("mp4") || mime?.includes("m4a") || mime?.includes("aac")) {
    return "m4a";
  }
  if (mime?.includes("webm") || mime?.includes("opus")) return "webm";
  if (mime?.includes("mpeg") || mime?.includes("mp3")) return "mp3";
  return "m4a";
}

export function mimeFor(format: AudioFormat): string {
  if (format === "mp3") return "audio/mpeg";
  if (format === "m4a") return "audio/mp4";
  return "application/octet-stream";
}

export function blobKey(id: string, format: AudioFormat): string {
  return `${id}::${format}`;
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
