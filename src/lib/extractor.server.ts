import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { Readable } from "node:stream";
import type { AudioFormat, ExtractorCaps, ResolveResult, Track } from "./media";
import { contentDisposition, mimeFor, safeFilename, thumbFor, watchUrl } from "./media";
import { parseYoutubeInput, toYtdlpTarget } from "./youtube-url";

const execFileAsync = promisify(execFile);

const MAX_PLAYLIST = 40;
const JSON_TIMEOUT_MS = 45_000;
const DOWNLOAD_TIMEOUT_MS = 180_000;

type YtEntry = {
  id?: string;
  title?: string;
  fulltitle?: string;
  uploader?: string;
  channel?: string;
  creator?: string;
  duration?: number | null;
  thumbnail?: string;
  thumbnails?: Array<{ url?: string }>;
  url?: string;
  webpage_url?: string;
  filesize?: number | null;
  filesize_approx?: number | null;
  _type?: string;
  entries?: Array<YtEntry | null>;
  playlist_count?: number;
  playlist_title?: string;
  playlist_id?: string;
  original_url?: string;
  extractor?: string;
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

function cookiesPath(): string | null {
  const env = process.env.YTDLP_COOKIES;
  if (env && existsSync(env)) return env;
  const local = path.join(process.cwd(), "cookies.txt");
  if (existsSync(local)) return local;
  return null;
}

export async function getCaps(): Promise<ExtractorCaps> {
  const ytdlp = Boolean(ytDlpPath());
  const ffmpeg = existsSync("/usr/local/bin/ffmpeg") || existsSync("/usr/bin/ffmpeg");
  const cookies = Boolean(cookiesPath());
  return { ytdlp, ffmpeg, python: pythonBin(), cookies };
}

function baseArgs(): string[] {
  const args = [
    "--js-runtimes",
    "node",
    "--no-warnings",
    "--no-check-certificates",
    "--newline",
  ];
  const cookies = cookiesPath();
  if (cookies) args.push("--cookies", cookies);
  return args;
}

async function runJson(args: string[]): Promise<YtEntry> {
  const bin = ytDlpPath();
  if (!bin) {
    throw new ExtractorError(
      "MISSING_YTDLP",
      "yt-dlp не установлен. Откройте раздел «Установка» и запустите скрипт.",
    );
  }
  const py = pythonBin();
  try {
    const { stdout } = await execFileAsync(py, [bin, ...baseArgs(), ...args], {
      timeout: JSON_TIMEOUT_MS,
      maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });
    const trimmed = stdout.trim();
    if (!trimmed) {
      throw new ExtractorError("EMPTY", "YouTube вернул пустой ответ.");
    }
    return JSON.parse(trimmed) as YtEntry;
  } catch (err) {
    throw mapExecError(err);
  }
}

export class ExtractorError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ExtractorError";
  }
}

function mapExecError(err: unknown): ExtractorError {
  const anyErr = err as {
    message?: string;
    stderr?: string;
    stdout?: string;
    killed?: boolean;
    code?: string | number;
  };
  const blob = `${anyErr.stderr ?? ""} ${anyErr.stdout ?? ""} ${anyErr.message ?? ""}`;
  if (/playlist does not exist/i.test(blob)) {
    return new ExtractorError("NOT_FOUND", "Такого плейлиста нет или он закрыт.");
  }
  if (/video unavailable|private video|this video is not available/i.test(blob)) {
    return new ExtractorError("UNAVAILABLE", "Ролик недоступен, удалён или скрыт.");
  }
  if (/sign in to confirm|not a bot/i.test(blob)) {
    return new ExtractorError(
      "BOTCHECK",
      "YouTube просит подтвердить, что вы не бот. На своей машине положите cookies.txt в корень проекта — см. раздел «Установка».",
    );
  }
  if (/HTTP Error 403|403: Forbidden/i.test(blob)) {
    return new ExtractorError(
      "YOUTUBE_BLOCKED",
      "YouTube отклонил загрузку с этого сервера. С домашней сети это обычно проходит — запустите скрипт установки.",
    );
  }
  if (anyErr.killed) {
    return new ExtractorError("TIMEOUT", "YouTube слишком долго отвечает. Попробуйте ещё раз.");
  }
  const first = blob
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("ERROR:"));
  return new ExtractorError(
    "EXTRACT",
    first?.replace(/^ERROR:\s*/i, "") || "Не удалось разобрать ссылку.",
  );
}

function asTrack(entry: YtEntry | null | undefined): Track | null {
  if (!entry?.id || entry.id === "_") return null;
  if (entry._type === "playlist") return null;
  const title = (entry.title || entry.fulltitle || "Без названия").trim();
  if (title === "[Deleted video]" || title === "[Private video]") return null;
  const channel = (entry.channel || entry.uploader || entry.creator || "YouTube").trim();
  const thumbs = entry.thumbnails ?? [];
  const thumbnail =
    entry.thumbnail || thumbs[thumbs.length - 1]?.url || thumbFor(entry.id);
  const duration =
    typeof entry.duration === "number" && Number.isFinite(entry.duration)
      ? entry.duration
      : null;
  const filesize =
    (typeof entry.filesize === "number" && entry.filesize) ||
    (typeof entry.filesize_approx === "number" && entry.filesize_approx) ||
    null;
  return {
    id: entry.id,
    title,
    channel,
    duration,
    thumbnail,
    url: entry.webpage_url || entry.url || watchUrl(entry.id),
    filesize,
  };
}

export async function resolveInput(raw: string): Promise<ResolveResult> {
  const parsed = parseYoutubeInput(raw);
  if (parsed.kind === "empty") {
    throw new ExtractorError("EMPTY", "Вставьте ссылку или поисковый запрос.");
  }

  if (parsed.kind === "search") {
    const data = await runJson([
      "-J",
      "--flat-playlist",
      "--playlist-end",
      "8",
      toYtdlpTarget(parsed),
    ]);
    const tracks = (data.entries ?? []).map(asTrack).filter((t): t is Track => Boolean(t));
    return { kind: "search", query: parsed.query, tracks };
  }

  if (parsed.kind === "playlist" || (parsed.kind === "video" && parsed.playlistId)) {
    const playlistId = parsed.kind === "playlist" ? parsed.playlistId : parsed.playlistId!;
    const data = await runJson([
      "-J",
      "--yes-playlist",
      "--flat-playlist",
      "--playlist-end",
      String(MAX_PLAYLIST),
      `https://www.youtube.com/playlist?list=${playlistId}`,
    ]);
    const tracks = (data.entries ?? []).map(asTrack).filter((t): t is Track => Boolean(t));
    if (tracks.length === 0 && parsed.kind === "video") {
      return resolveVideo(parsed.videoId);
    }
    return {
      kind: "playlist",
      id: data.playlist_id || playlistId,
      title: data.title || data.playlist_title || "Плейлист",
      channel: data.uploader || data.channel || "",
      tracks,
    };
  }

  return resolveVideo(parsed.videoId);
}

async function resolveVideo(videoId: string): Promise<ResolveResult> {
  const data = await runJson([
    "-J",
    "--no-playlist",
    "--skip-download",
    watchUrl(videoId),
  ]);
  const track = asTrack(data);
  if (!track) {
    throw new ExtractorError("NOT_FOUND", "Не удалось получить данные ролика.");
  }
  return { kind: "video", track };
}

let activeDownloads = 0;
const waiters: Array<() => void> = [];

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (activeDownloads >= 2) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  activeDownloads += 1;
  try {
    return await fn();
  } finally {
    activeDownloads -= 1;
    waiters.shift()?.();
  }
}

export type AudioFile = {
  path: string;
  filename: string;
  mime: string;
  cleanup: () => Promise<void>;
};

function formatArgs(format: AudioFormat): string[] {
  if (format === "mp3") {
    return ["-f", "bestaudio/best", "-x", "--audio-format", "mp3", "--audio-quality", "0"];
  }
  if (format === "m4a") {
    return ["-f", "bestaudio/best", "-x", "--audio-format", "m4a", "--audio-quality", "0"];
  }
  return ["-f", "bestaudio[ext=m4a]/bestaudio/best"];
}

export async function extractAudio(videoId: string, format: AudioFormat): Promise<AudioFile> {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    throw new ExtractorError("BAD_ID", "Некорректный идентификатор ролика.");
  }
  const bin = ytDlpPath();
  if (!bin) {
    throw new ExtractorError(
      "MISSING_YTDLP",
      "yt-dlp не установлен. Откройте раздел «Установка».",
    );
  }

  return withSlot(async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "octava-"));
    const outTpl = path.join(dir, "%(id)s.%(ext)s");
    const py = pythonBin();
    const args = [
      bin,
      ...baseArgs(),
      ...formatArgs(format),
      "--no-playlist",
      "--no-part",
      "--no-mtime",
      "-o",
      outTpl,
      "--",
      watchUrl(videoId),
    ];

    await new Promise<void>((resolve, reject) => {
      const child = spawn(py, args, {
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stderr = "";
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
      }, DOWNLOAD_TIMEOUT_MS);
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });
      child.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(Object.assign(new Error("yt-dlp failed"), { stderr, code }));
      });
    }).catch(async (err) => {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
      throw mapExecError(err);
    });

    const files = (await readdir(dir)).filter((f) => !f.endsWith(".part"));
    const audio = files[0];
    if (!audio) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
      throw new ExtractorError("EMPTY_FILE", "Файл не был сохранён.");
    }
    const filePath = path.join(dir, audio);
    const info = await stat(filePath);
    if (info.size < 256) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
      throw new ExtractorError(
        "YOUTUBE_BLOCKED",
        "YouTube отклонил загрузку с этого сервера. Запустите Octava у себя через скрипт установки.",
      );
    }
    const ext = path.extname(audio).slice(1) || (format === "mp3" ? "mp3" : "m4a");
    const titleGuess = audio.replace(/\.[^.]+$/, "") || videoId;
    return {
      path: filePath,
      filename: `${safeFilename(titleGuess)}.${ext}`,
      mime: mimeFor(format === "source" ? "source" : format),
      cleanup: async () => {
        await unlink(filePath).catch(() => {});
        await rm(dir, { recursive: true, force: true }).catch(() => {});
      },
    };
  });
}

export async function streamAudioFile(file: AudioFile): Promise<Response> {
  const info = await stat(file.path);
  const nodeStream = createReadStream(file.path);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  const finalize = () => {
    void file.cleanup();
  };
  nodeStream.on("close", finalize);
  nodeStream.on("error", finalize);
  return new Response(webStream, {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(info.size),
      "Content-Disposition": contentDisposition(file.filename),
      "Cache-Control": "private, no-store",
    },
  });
}

export function errorResponse(err: unknown): Response {
  const mapped =
    err instanceof ExtractorError ? err : mapExecError(err);
  const status =
    mapped.code === "MISSING_YTDLP"
      ? 503
      : mapped.code === "NOT_FOUND" || mapped.code === "UNAVAILABLE"
        ? 404
        : mapped.code === "BAD_ID" || mapped.code === "EMPTY"
          ? 400
          : 502;
  return Response.json(
    { code: mapped.code, message: mapped.message },
    { status },
  );
}
