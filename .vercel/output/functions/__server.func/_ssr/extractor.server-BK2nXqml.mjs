import { Readable } from "node:stream";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, readdir, rm, stat, unlink } from "node:fs/promises";
import os from "node:os";
import { promisify } from "node:util";
//#region node_modules/.nitro/vite/services/ssr/assets/extractor.server-BK2nXqml.js
var FORMAT_LABEL = {
	m4a: "M4A",
	mp3: "MP3",
	source: "как есть"
};
function formatDuration(sec) {
	if (sec == null || !Number.isFinite(sec) || sec < 0) return "—";
	const total = Math.round(sec);
	const h = Math.floor(total / 3600);
	const m = Math.floor(total % 3600 / 60);
	const s = total % 60;
	if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	return `${m}:${String(s).padStart(2, "0")}`;
}
function formatBytes(bytes) {
	if (bytes == null || bytes <= 0) return "";
	if (bytes < 1024) return `${bytes} Б`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} КБ`;
	return `${(bytes / 1048576).toFixed(1)} МБ`;
}
function thumbFor(id) {
	return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
function watchUrl(id) {
	return `https://www.youtube.com/watch?v=${id}`;
}
function safeFilename(name, max = 96) {
	return (name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max).trim() || "audio").replace(/[. ]+$/g, "") || "audio";
}
function extensionFor(format, mime) {
	if (format === "mp3") return "mp3";
	if (format === "m4a") return "m4a";
	if (mime?.includes("mp4") || mime?.includes("m4a") || mime?.includes("aac")) return "m4a";
	if (mime?.includes("webm") || mime?.includes("opus")) return "webm";
	if (mime?.includes("mpeg") || mime?.includes("mp3")) return "mp3";
	return "m4a";
}
function mimeFor(format) {
	if (format === "mp3") return "audio/mpeg";
	if (format === "m4a") return "audio/mp4";
	return "application/octet-stream";
}
function blobKey(id, format) {
	return `${id}::${format}`;
}
function newId(prefix) {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function contentDisposition(filename) {
	return `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
var VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
var PLAYLIST_ID = /^[A-Za-z0-9_-]{10,}$/;
function pickParam(url, key) {
	const value = url.searchParams.get(key);
	return value && value.length > 0 ? value : void 0;
}
function hostIsYoutube(host) {
	const h = host.replace(/^www\./, "").toLowerCase();
	return h === "youtube.com" || h === "m.youtube.com" || h === "music.youtube.com" || h === "youtube-nocookie.com" || h === "youtu.be";
}
function parseYoutubeInput(raw) {
	const input = raw.trim();
	if (!input) return { kind: "empty" };
	if (!/^(https?:\/\/|www\.|youtu\.be\/|youtube\.com\/)/i.test(input)) {
		if (VIDEO_ID.test(input)) return {
			kind: "video",
			videoId: input
		};
		return {
			kind: "search",
			query: input
		};
	}
	let href = input;
	if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
	let url;
	try {
		url = new URL(href);
	} catch {
		return {
			kind: "search",
			query: input
		};
	}
	if (!hostIsYoutube(url.hostname)) return {
		kind: "search",
		query: input
	};
	const host = url.hostname.replace(/^www\./, "").toLowerCase();
	const parts = url.pathname.split("/").filter(Boolean);
	const videoParam = pickParam(url, "v");
	const listParam = pickParam(url, "list");
	const isNamedPlaylist = Boolean(listParam) && (listParam.startsWith("PL") || listParam.startsWith("OL") || listParam.startsWith("UU") || listParam.startsWith("FL"));
	if (host === "youtu.be" && parts[0] && VIDEO_ID.test(parts[0])) return {
		kind: "video",
		videoId: parts[0],
		playlistId: isNamedPlaylist ? listParam : void 0
	};
	if (parts[0] === "shorts" && parts[1] && VIDEO_ID.test(parts[1])) return {
		kind: "video",
		videoId: parts[1]
	};
	if (parts[0] === "embed" && parts[1] && VIDEO_ID.test(parts[1])) return {
		kind: "video",
		videoId: parts[1]
	};
	if (parts[0] === "live" && parts[1] && VIDEO_ID.test(parts[1])) return {
		kind: "video",
		videoId: parts[1]
	};
	if (parts[0] === "playlist" && listParam && PLAYLIST_ID.test(listParam)) return {
		kind: "playlist",
		playlistId: listParam
	};
	if (videoParam && VIDEO_ID.test(videoParam)) {
		if (isNamedPlaylist) return {
			kind: "video",
			videoId: videoParam,
			playlistId: listParam
		};
		return {
			kind: "video",
			videoId: videoParam
		};
	}
	if (listParam && PLAYLIST_ID.test(listParam)) return {
		kind: "playlist",
		playlistId: listParam
	};
	return {
		kind: "search",
		query: input
	};
}
function toYtdlpTarget(parsed) {
	if (parsed.kind === "search") return `ytsearch8:${parsed.query}`;
	if (parsed.kind === "playlist") return `https://www.youtube.com/playlist?list=${parsed.playlistId}`;
	if (parsed.playlistId) return `https://www.youtube.com/watch?v=${parsed.videoId}&list=${parsed.playlistId}`;
	return `https://www.youtube.com/watch?v=${parsed.videoId}`;
}
var execFileAsync = promisify(execFile);
var MAX_PLAYLIST = 40;
var JSON_TIMEOUT_MS = 45e3;
var DOWNLOAD_TIMEOUT_MS = 18e4;
function pythonBin() {
	if (existsSync("/usr/bin/python3.11")) return "/usr/bin/python3.11";
	if (existsSync("/usr/local/bin/python3")) return "/usr/local/bin/python3";
	return "python3";
}
function ytDlpPath() {
	const candidates = [
		process.env.YT_DLP_PATH,
		path.join(process.cwd(), "bin/yt-dlp"),
		"/workspace/bin/yt-dlp"
	].filter((p) => Boolean(p));
	for (const candidate of candidates) if (existsSync(candidate)) return candidate;
	return null;
}
function cookiesPath() {
	const env = process.env.YTDLP_COOKIES;
	if (env && existsSync(env)) return env;
	const local = path.join(process.cwd(), "cookies.txt");
	if (existsSync(local)) return local;
	return null;
}
async function getCaps() {
	const ytdlp = Boolean(ytDlpPath());
	const ffmpeg = existsSync("/usr/local/bin/ffmpeg") || existsSync("/usr/bin/ffmpeg");
	const cookies = Boolean(cookiesPath());
	return {
		ytdlp,
		ffmpeg,
		python: pythonBin(),
		cookies
	};
}
function baseArgs() {
	const args = [
		"--js-runtimes",
		"node",
		"--no-warnings",
		"--no-check-certificates",
		"--newline"
	];
	const cookies = cookiesPath();
	if (cookies) args.push("--cookies", cookies);
	return args;
}
async function runJson(args) {
	const bin = ytDlpPath();
	if (!bin) throw new ExtractorError("MISSING_YTDLP", "yt-dlp не установлен. Откройте раздел «Установка» и запустите скрипт.");
	const py = pythonBin();
	try {
		const { stdout } = await execFileAsync(py, [
			bin,
			...baseArgs(),
			...args
		], {
			timeout: JSON_TIMEOUT_MS,
			maxBuffer: 16777216,
			env: {
				...process.env,
				PYTHONUNBUFFERED: "1"
			}
		});
		const trimmed = stdout.trim();
		if (!trimmed) throw new ExtractorError("EMPTY", "YouTube вернул пустой ответ.");
		return JSON.parse(trimmed);
	} catch (err) {
		throw mapExecError(err);
	}
}
var ExtractorError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "ExtractorError";
	}
};
function mapExecError(err) {
	const anyErr = err;
	const blob = `${anyErr.stderr ?? ""} ${anyErr.stdout ?? ""} ${anyErr.message ?? ""}`;
	if (/playlist does not exist/i.test(blob)) return new ExtractorError("NOT_FOUND", "Такого плейлиста нет или он закрыт.");
	if (/video unavailable|private video|this video is not available/i.test(blob)) return new ExtractorError("UNAVAILABLE", "Ролик недоступен, удалён или скрыт.");
	if (/sign in to confirm|not a bot/i.test(blob)) return new ExtractorError("BOTCHECK", "YouTube просит подтвердить, что вы не бот. На своей машине положите cookies.txt в корень проекта — см. раздел «Установка».");
	if (/HTTP Error 403|403: Forbidden/i.test(blob)) return new ExtractorError("YOUTUBE_BLOCKED", "YouTube отклонил загрузку с этого сервера. С домашней сети это обычно проходит — запустите скрипт установки.");
	if (anyErr.killed) return new ExtractorError("TIMEOUT", "YouTube слишком долго отвечает. Попробуйте ещё раз.");
	return new ExtractorError("EXTRACT", blob.split("\n").map((l) => l.trim()).find((l) => l.startsWith("ERROR:"))?.replace(/^ERROR:\s*/i, "") || "Не удалось разобрать ссылку.");
}
function asTrack(entry) {
	if (!entry?.id || entry.id === "_") return null;
	if (entry._type === "playlist") return null;
	const title = (entry.title || entry.fulltitle || "Без названия").trim();
	if (title === "[Deleted video]" || title === "[Private video]") return null;
	const channel = (entry.channel || entry.uploader || entry.creator || "YouTube").trim();
	const thumbs = entry.thumbnails ?? [];
	const thumbnail = entry.thumbnail || thumbs[thumbs.length - 1]?.url || thumbFor(entry.id);
	const duration = typeof entry.duration === "number" && Number.isFinite(entry.duration) ? entry.duration : null;
	const filesize = typeof entry.filesize === "number" && entry.filesize || typeof entry.filesize_approx === "number" && entry.filesize_approx || null;
	return {
		id: entry.id,
		title,
		channel,
		duration,
		thumbnail,
		url: entry.webpage_url || entry.url || watchUrl(entry.id),
		filesize
	};
}
async function resolveInput(raw) {
	const parsed = parseYoutubeInput(raw);
	if (parsed.kind === "empty") throw new ExtractorError("EMPTY", "Вставьте ссылку или поисковый запрос.");
	if (parsed.kind === "search") {
		const tracks = ((await runJson([
			"-J",
			"--flat-playlist",
			"--playlist-end",
			"8",
			toYtdlpTarget(parsed)
		])).entries ?? []).map(asTrack).filter((t) => Boolean(t));
		return {
			kind: "search",
			query: parsed.query,
			tracks
		};
	}
	if (parsed.kind === "playlist" || parsed.kind === "video" && parsed.playlistId) {
		const playlistId = parsed.kind === "playlist" ? parsed.playlistId : parsed.playlistId;
		const data = await runJson([
			"-J",
			"--yes-playlist",
			"--flat-playlist",
			"--playlist-end",
			String(MAX_PLAYLIST),
			`https://www.youtube.com/playlist?list=${playlistId}`
		]);
		const tracks = (data.entries ?? []).map(asTrack).filter((t) => Boolean(t));
		if (tracks.length === 0 && parsed.kind === "video") return resolveVideo(parsed.videoId);
		return {
			kind: "playlist",
			id: data.playlist_id || playlistId,
			title: data.title || data.playlist_title || "Плейлист",
			channel: data.uploader || data.channel || "",
			tracks
		};
	}
	return resolveVideo(parsed.videoId);
}
async function resolveVideo(videoId) {
	const track = asTrack(await runJson([
		"-J",
		"--no-playlist",
		"--skip-download",
		watchUrl(videoId)
	]));
	if (!track) throw new ExtractorError("NOT_FOUND", "Не удалось получить данные ролика.");
	return {
		kind: "video",
		track
	};
}
var activeDownloads = 0;
var waiters = [];
async function withSlot(fn) {
	if (activeDownloads >= 2) await new Promise((resolve) => waiters.push(resolve));
	activeDownloads += 1;
	try {
		return await fn();
	} finally {
		activeDownloads -= 1;
		waiters.shift()?.();
	}
}
function formatArgs(format) {
	if (format === "mp3") return [
		"-f",
		"bestaudio/best",
		"-x",
		"--audio-format",
		"mp3",
		"--audio-quality",
		"0"
	];
	if (format === "m4a") return [
		"-f",
		"bestaudio/best",
		"-x",
		"--audio-format",
		"m4a",
		"--audio-quality",
		"0"
	];
	return ["-f", "bestaudio[ext=m4a]/bestaudio/best"];
}
async function extractAudio(videoId, format) {
	if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new ExtractorError("BAD_ID", "Некорректный идентификатор ролика.");
	const bin = ytDlpPath();
	if (!bin) throw new ExtractorError("MISSING_YTDLP", "yt-dlp не установлен. Откройте раздел «Установка».");
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
			watchUrl(videoId)
		];
		await new Promise((resolve, reject) => {
			const child = spawn(py, args, {
				env: {
					...process.env,
					PYTHONUNBUFFERED: "1"
				},
				stdio: [
					"ignore",
					"pipe",
					"pipe"
				]
			});
			let stderr = "";
			const timer = setTimeout(() => {
				child.kill("SIGKILL");
			}, DOWNLOAD_TIMEOUT_MS);
			child.stderr.on("data", (chunk) => {
				stderr += chunk.toString("utf8");
			});
			child.on("error", (err) => {
				clearTimeout(timer);
				reject(err);
			});
			child.on("close", (code) => {
				clearTimeout(timer);
				if (code === 0) resolve();
				else reject(Object.assign(/* @__PURE__ */ new Error("yt-dlp failed"), {
					stderr,
					code
				}));
			});
		}).catch(async (err) => {
			await rm(dir, {
				recursive: true,
				force: true
			}).catch(() => {});
			throw mapExecError(err);
		});
		const audio = (await readdir(dir)).filter((f) => !f.endsWith(".part"))[0];
		if (!audio) {
			await rm(dir, {
				recursive: true,
				force: true
			}).catch(() => {});
			throw new ExtractorError("EMPTY_FILE", "Файл не был сохранён.");
		}
		const filePath = path.join(dir, audio);
		if ((await stat(filePath)).size < 256) {
			await rm(dir, {
				recursive: true,
				force: true
			}).catch(() => {});
			throw new ExtractorError("YOUTUBE_BLOCKED", "YouTube отклонил загрузку с этого сервера. Запустите Octava у себя через скрипт установки.");
		}
		const ext = path.extname(audio).slice(1) || (format === "mp3" ? "mp3" : "m4a");
		return {
			path: filePath,
			filename: `${safeFilename(audio.replace(/\.[^.]+$/, "") || videoId)}.${ext}`,
			mime: mimeFor(format === "source" ? "source" : format),
			cleanup: async () => {
				await unlink(filePath).catch(() => {});
				await rm(dir, {
					recursive: true,
					force: true
				}).catch(() => {});
			}
		};
	});
}
async function streamAudioFile(file) {
	const info = await stat(file.path);
	const nodeStream = createReadStream(file.path);
	const webStream = Readable.toWeb(nodeStream);
	const finalize = () => {
		file.cleanup();
	};
	nodeStream.on("close", finalize);
	nodeStream.on("error", finalize);
	return new Response(webStream, { headers: {
		"Content-Type": file.mime,
		"Content-Length": String(info.size),
		"Content-Disposition": contentDisposition(file.filename),
		"Cache-Control": "private, no-store"
	} });
}
function errorResponse(err) {
	const mapped = err instanceof ExtractorError ? err : mapExecError(err);
	const status = mapped.code === "MISSING_YTDLP" ? 503 : mapped.code === "NOT_FOUND" || mapped.code === "UNAVAILABLE" ? 404 : mapped.code === "BAD_ID" || mapped.code === "EMPTY" ? 400 : 502;
	return Response.json({
		code: mapped.code,
		message: mapped.message
	}, { status });
}
//#endregion
export { extensionFor as a, formatDuration as c, resolveInput as d, safeFilename as f, errorResponse as i, getCaps as l, FORMAT_LABEL as n, extractAudio as o, streamAudioFile as p, blobKey as r, formatBytes as s, ExtractorError as t, newId as u };
