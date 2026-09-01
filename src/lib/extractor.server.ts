import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import type { AudioFormat, ExtractorCaps, Mp3Quality, ResolveResult, Track } from "./media";
import {
  contentDisposition,
  DEFAULT_MP3_QUALITY,
  mimeFor,
  mp3FfmpegQuality,
  safeFilename,
  thumbFor,
  watchUrl,
} from "./media";
import { parseYoutubeInput, toYtdlpTarget } from "./youtube-url";
import { normalizeCookieFile } from "./cookie-file";
import { cookieStatus } from "./cookie-store.server";
import {
  appendLog,
  dumpLogText,
  feedLogChunk,
  flushLogCarry,
  resetDownloadProgress,
  sanitizeLog,
} from "./yt-log.server";

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
  const ck = await cookieStatus();
  return {
    ytdlp,
    ffmpeg,
    python: pythonBin(),
    cookies: ck.present,
    cookieCount: ck.count,
  };
}

function baseArgs(cookieFile?: string | null): string[] {
  const args = [
    "--js-runtimes",
    "node",
    "--no-check-certificates",
    "--newline",
    "--extractor-args",
    "youtube:player_client=default,-tv_downgraded",
  ];
  const file = cookieFile === undefined ? cookiesPath() : cookieFile;
  if (file) args.push("--cookies", file);
  return args;
}

async function withCookieFile<T>(
  raw: string | undefined,
  fn: (cookieFile: string | null) => Promise<T>,
): Promise<T> {
  const text = raw?.trim();
  if (!text) return fn(cookiesPath());
  let normalized: string;
  try {
    normalized = normalizeCookieFile(text);
  } catch {
    throw new ExtractorError(
      "BAD_COOKIES",
      "Не похоже на cookies.txt. Вставьте Netscape-файл или JSON экспорта.",
    );
  }
  const dir = await mkdtemp(path.join(os.tmpdir(), "octava-ck-"));
  const file = path.join(dir, "cookies.txt");
  await writeFile(file, normalized, { encoding: "utf8", mode: 0o600 });
  try {
    return await fn(file);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function runYtDlp(
  extraArgs: string[],
  cookieFile: string | null,
  timeoutMs: number,
  collectStdout: boolean,
): Promise<{ code: number | null; stdout: string; stderr: string; killed: boolean }> {
  const bin = ytDlpPath();
  if (!bin) {
    throw new ExtractorError(
      "MISSING_YTDLP",
      "yt-dlp не установлен. Откройте раздел «Установка» и запустите скрипт.",
    );
  }
  const py = pythonBin();
  const args = [bin, ...baseArgs(cookieFile), ...extraArgs];
  return new Promise((resolve, reject) => {
    const child = spawn(py, args, {
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", collectStdout ? "pipe" : "ignore", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const carry = { buf: "" };
    let killed = false;
    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    if (child.stdout) {
      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
        if (stdout.length > 16 * 1024 * 1024) {
          stdout = stdout.slice(-8 * 1024 * 1024);
        }
      });
    }
    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stderr += text;
      if (stderr.length > 64_000) stderr = stderr.slice(-48_000);
      feedLogChunk(text, carry);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      flushLogCarry(carry);
      resolve({ code, stdout, stderr, killed });
    });
  });
}

async function runJson(args: string[], cookieFile?: string | null): Promise<YtEntry> {
  try {
    const proc = await runYtDlp(args, cookieFile ?? null, JSON_TIMEOUT_MS, true);
    if (proc.killed) {
      throw Object.assign(new Error("yt-dlp timeout"), {
        killed: true,
        stderr: proc.stderr,
      });
    }
    if (proc.code !== 0) {
      throw Object.assign(new Error("yt-dlp failed"), {
        code: proc.code,
        stderr: proc.stderr,
        stdout: proc.stdout,
      });
    }
    const trimmed = proc.stdout.trim();
    if (!trimmed) {
      throw new ExtractorError("EMPTY", "YouTube вернул пустой ответ.", proc.stderr);
    }
    return JSON.parse(trimmed) as YtEntry;
  } catch (err) {
    if (err instanceof ExtractorError) throw err;
    throw mapExecError(err);
  }
}

export class ExtractorError extends Error {
  code: string;
  log: string;
  constructor(code: string, message: string, log = "") {
    super(message);
    this.code = code;
    this.name = "ExtractorError";
    this.log = sanitizeLog(log);
    appendLog("error", message);
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
  const stderr = sanitizeLog(anyErr.stderr ?? "");
  const blob = `${stderr} ${anyErr.stdout ?? ""} ${anyErr.message ?? ""}`;
  let mapped: ExtractorError;
  if (/playlist does not exist/i.test(blob)) {
    mapped = new ExtractorError("NOT_FOUND", "Такого плейлиста нет или он закрыт.", stderr);
  } else if (/video unavailable|private video|this video is not available/i.test(blob)) {
    mapped = new ExtractorError("UNAVAILABLE", "Ролик недоступен, удалён или скрыт.", stderr);
  } else if (/sign in to confirm|not a bot/i.test(blob)) {
    mapped = new ExtractorError(
      "BOTCHECK",
      "YouTube просит подтвердить, что вы не бот. Вставьте cookies YouTube в поле на главной — после согласия.",
      stderr,
    );
  } else if (
    /please reload|reload this page|reload the page|needs to be reloaded|page needs to be reload/i.test(
      blob,
    )
  ) {
    mapped = new ExtractorError(
      "SESSION",
      "YouTube сбросил сессию cookies. Экспортируйте свежий cookies.txt на youtube.com и загрузите его снова.",
      stderr,
    );
  } else if (/requested format is not available/i.test(blob)) {
    mapped = new ExtractorError(
      "NO_FORMAT",
      "Для этого ролика нет подходящей аудиодорожки. Попробуйте формат «как есть» или обновите cookies.",
      stderr,
    );
  } else if (/ffmpeg exited with code -?11|signal 11|SIGSEGV/i.test(blob)) {
    mapped = new ExtractorError(
      "FFMPEG",
      "ffmpeg не смог перекодировать этот файл. Попробуйте формат M4A или «как есть».",
      stderr,
    );
  } else if (/HTTP Error 403|403: Forbidden/i.test(blob)) {
    mapped = new ExtractorError(
      "YOUTUBE_BLOCKED",
      "YouTube отклонил загрузку с этого сервера. Добавьте cookies YouTube в поле на главной или запустите скрипт установки у себя.",
      stderr,
    );
  } else if (anyErr.killed) {
    mapped = new ExtractorError(
      "TIMEOUT",
      "YouTube слишком долго отвечает. Попробуйте ещё раз.",
      stderr,
    );
  } else {
    const first = blob
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("ERROR:"));
    mapped = new ExtractorError(
      "EXTRACT",
      first?.replace(/^ERROR:\s*/i, "") || "Не удалось разобрать ссылку.",
      stderr,
    );
  }
  return mapped;
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

export async function resolveInput(raw: string, cookiesText?: string): Promise<ResolveResult> {
  appendLog("info", `запрос: ${raw.trim().slice(0, 180)}`);
  try {
    const result = await withCookieFile(cookiesText, (cookieFile) =>
      resolveWith(raw, cookieFile),
    );
    if (result.kind === "video") {
      appendLog("ok", `ролик: ${result.track.title}`);
    } else if (result.kind === "playlist") {
      appendLog("ok", `плейлист «${result.title}» · ${result.tracks.length} треков`);
    } else {
      appendLog("ok", `поиск «${result.query}» · ${result.tracks.length} результатов`);
    }
    return result;
  } catch (err) {
    if (err instanceof ExtractorError) throw err;
    throw mapExecError(err);
  }
}

async function resolveWith(raw: string, cookieFile: string | null): Promise<ResolveResult> {
  const parsed = parseYoutubeInput(raw);
  if (parsed.kind === "empty") {
    throw new ExtractorError("EMPTY", "Вставьте ссылку или поисковый запрос.");
  }

  if (parsed.kind === "search") {
    const data = await runJson(
      ["-J", "--flat-playlist", "--playlist-end", "8", toYtdlpTarget(parsed)],
      cookieFile,
    );
    const tracks = (data.entries ?? []).map(asTrack).filter((t): t is Track => Boolean(t));
    return { kind: "search", query: parsed.query, tracks };
  }

  if (parsed.kind === "playlist" || (parsed.kind === "video" && parsed.playlistId)) {
    const playlistId = parsed.kind === "playlist" ? parsed.playlistId : parsed.playlistId!;
    const data = await runJson(
      [
        "-J",
        "--yes-playlist",
        "--flat-playlist",
        "--playlist-end",
        String(MAX_PLAYLIST),
        `https://www.youtube.com/playlist?list=${playlistId}`,
      ],
      cookieFile,
    );
    const tracks = (data.entries ?? []).map(asTrack).filter((t): t is Track => Boolean(t));
    if (tracks.length === 0 && parsed.kind === "video") {
      return resolveVideo(parsed.videoId, cookieFile);
    }
    return {
      kind: "playlist",
      id: data.playlist_id || playlistId,
      title: data.title || data.playlist_title || "Плейлист",
      channel: data.uploader || data.channel || "",
      tracks,
    };
  }

  return resolveVideo(parsed.videoId, cookieFile);
}

async function resolveVideo(videoId: string, cookieFile: string | null): Promise<ResolveResult> {
  const data = await runJson(
    ["-J", "--no-playlist", "--skip-download", watchUrl(videoId)],
    cookieFile,
  );
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

function formatAttempts(format: AudioFormat, quality: Mp3Quality): string[][] {
  if (format === "mp3") {
    return [
      [
        "-f",
        "bestaudio/best",
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        mp3FfmpegQuality(quality),
      ],
      [
        "-f",
        "ba/b",
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        mp3FfmpegQuality(quality),
      ],
    ];
  }
  if (format === "m4a") {
    return [
      [
        "-f",
        "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio/best",
        "-x",
        "--audio-format",
        "m4a",
      ],
      ["-f", "ba[ext=m4a]/ba/b"],
      ["-f", "ba/b"],
    ];
  }
  return [
    ["-f", "ba[ext=m4a]/ba/b"],
    ["-f", "ba/b"],
  ];
}

function isRetryableFormatError(stderr: string): boolean {
  return /requested format is not available/i.test(stderr);
}

export async function extractAudio(
  videoId: string,
  format: AudioFormat,
  cookiesText?: string,
  quality: Mp3Quality = DEFAULT_MP3_QUALITY,
): Promise<AudioFile> {
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

  resetDownloadProgress();
  appendLog(
    "info",
    format === "mp3"
      ? `скачивание ${videoId} · mp3 ${quality}k`
      : `скачивание ${videoId} · ${format}`,
  );

  return withCookieFile(cookiesText, (cookieFile) =>
    withSlot(async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "octava-"));
    const outTpl = path.join(dir, "%(id)s.%(ext)s");
    const attempts = formatAttempts(format, quality);
    let lastFail: { code: number | null; stderr: string; killed: boolean } | null =
      null;
    for (let i = 0; i < attempts.length; i++) {
      const args = [
        ...attempts[i]!,
        "--no-playlist",
        "--no-part",
        "--no-mtime",
        "--progress",
        "-o",
        outTpl,
        "--",
        watchUrl(videoId),
      ];
      try {
        const proc = await runYtDlp(args, cookieFile, DOWNLOAD_TIMEOUT_MS, false);
        if (proc.killed) {
          lastFail = proc;
          break;
        }
        if (proc.code === 0) {
          if (/unable to download video data|HTTP Error 403/i.test(proc.stderr)) {
            lastFail = proc;
            break;
          }
          lastFail = null;
          break;
        }
        lastFail = proc;
        if (i < attempts.length - 1 && isRetryableFormatError(proc.stderr)) {
          appendLog("warn", "формат недоступен, другой вариант");
          continue;
        }
        break;
      } catch (err) {
        await rm(dir, { recursive: true, force: true }).catch(() => {});
        if (err instanceof ExtractorError) throw err;
        throw mapExecError(err);
      }
    }
    if (lastFail) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
      throw mapExecError(
        Object.assign(new Error("yt-dlp failed"), {
          killed: lastFail.killed,
          code: lastFail.code,
          stderr: lastFail.stderr,
        }),
      );
    }

    const files = (await readdir(dir)).filter((f) => !f.endsWith(".part"));
    const audio = files[0];
    if (!audio) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
      throw new ExtractorError("EMPTY_FILE", "Файл не был сохранён.");
    }
    const filePath = path.join(dir, audio);
    const info = await stat(filePath);
    if (info.size < 4_096) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
      throw new ExtractorError(
        "YOUTUBE_BLOCKED",
        "YouTube отклонил загрузку с этого сервера. Добавьте cookies YouTube или запустите установщик у себя.",
      );
    }
    const ext = path.extname(audio).slice(1) || (format === "mp3" ? "mp3" : "m4a");
    const titleGuess = audio.replace(/\.[^.]+$/, "") || videoId;
    appendLog("ok", `готово ${videoId} · ${info.size} байт`);
    return {
      path: filePath,
      filename: `${safeFilename(titleGuess)}.${ext}`,
      mime: mimeFor(format === "source" ? "source" : format),
      cleanup: async () => {
        await unlink(filePath).catch(() => {});
        await rm(dir, { recursive: true, force: true }).catch(() => {});
      },
    };
  }),
  );
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
        : mapped.code === "BAD_ID" || mapped.code === "EMPTY" || mapped.code === "BAD_COOKIES"
          ? 400
          : 502;
  const log = mapped.log || dumpLogText(40);
  return Response.json(
    { code: mapped.code, message: mapped.message, log },
    { status },
  );
}
