import { Readable } from "node:stream";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import { promisify } from "node:util";
//#region node_modules/.nitro/vite/services/ssr/assets/extractor.server-DNRMIXe4.js
var MP3_QUALITIES = [
	"320",
	"192",
	"128"
];
var MP3_QUALITY_LABEL = {
	"320": "320",
	"192": "192",
	"128": "128"
};
function parseMp3Quality(raw) {
	if (typeof raw === "string" && MP3_QUALITIES.includes(raw)) return raw;
	return "192";
}
function mp3FfmpegQuality(quality) {
	return `${quality}K`;
}
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
function blobKey(id, format, quality = "192") {
	if (format === "mp3") return `${id}::mp3::${quality}`;
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
var NETSCAPE_HEADER = "# Netscape HTTP Cookie File\n";
function cookieCountLabel(n) {
	const n10 = n % 10;
	const n100 = n % 100;
	if (n10 === 1 && n100 !== 11) return `${n} запись`;
	if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${n} записи`;
	return `${n} записей`;
}
function isLikelyCookieFile(raw) {
	const text = stripBom(raw).trim();
	if (!text) return false;
	if (looksLikeJson(text)) try {
		return jsonCookies(text).length > 0;
	} catch {
		return false;
	}
	if (/#\s*(Netscape )?HTTP Cookie File/i.test(text)) return true;
	return netscapeRowCount(text) > 0;
}
function countCookieRows(raw) {
	const text = stripBom(raw).trim();
	if (!text) return 0;
	if (looksLikeJson(text)) try {
		return jsonCookies(text).length;
	} catch {
		return 0;
	}
	return netscapeRowCount(text);
}
function normalizeCookieFile(raw) {
	const text = stripBom(raw).trim();
	if (!text) throw new Error("Пустой файл cookies");
	if (looksLikeJson(text)) {
		const cookies = jsonCookies(text);
		if (cookies.length === 0) throw new Error("В файле нет cookie-записей");
		return slimNetscape(`${NETSCAPE_HEADER}${cookies.map(toNetscapeLine).join("\n")}\n`);
	}
	if (netscapeRowCount(text) === 0) throw new Error("Не похоже на cookies.txt. Вставьте Netscape-файл или JSON экспорта.");
	if (/#\s*(Netscape )?HTTP Cookie File/i.test(text)) return slimNetscape(text.endsWith("\n") ? text : `${text}\n`);
	return slimNetscape(`${NETSCAPE_HEADER}${text}${text.endsWith("\n") ? "" : "\n"}`);
}
function stripBom(raw) {
	return raw.replace(/^\uFEFF/, "");
}
function looksLikeJson(text) {
	const t = text.trimStart();
	return t.startsWith("[") || t.startsWith("{");
}
function netscapeRowCount(text) {
	let n = 0;
	for (const line of text.split(/\r?\n/)) if (isNetscapeRow(line)) n += 1;
	return n;
}
function isNetscapeRow(line) {
	const t = line.trim();
	if (!t) return false;
	const payload = t.startsWith("#HttpOnly_") ? t.slice(10) : t;
	if (payload.startsWith("#")) return false;
	return payload.split("	").length >= 7;
}
var AUTH_COOKIE_NAMES = /* @__PURE__ */ new Set([
	"SID",
	"HSID",
	"SSID",
	"APISID",
	"SAPISID",
	"SIDCC",
	"LOGIN_INFO",
	"PREF",
	"YSC",
	"CONSENT",
	"SOCS",
	"VISITOR_INFO1_LIVE",
	"VISITOR_PRIVACY_METADATA",
	"__Secure-1PSID",
	"__Secure-3PSID",
	"__Secure-1PAPISID",
	"__Secure-3PAPISID",
	"__Secure-1PSIDTS",
	"__Secure-3PSIDTS",
	"__Secure-1PSIDCC",
	"__Secure-3PSIDCC",
	"__Secure-YENID",
	"__Secure-YNID",
	"__Secure-BUCKET",
	"__Secure-ROLLOUT_TOKEN"
]);
function keepYoutubeCookie(name, value) {
	if (!name || name.startsWith("ST-")) return false;
	if (value.length > 12e3) return false;
	if (AUTH_COOKIE_NAMES.has(name)) return true;
	return name.startsWith("__Secure-") && /PSID|PAPISID|YNID|YENID/.test(name);
}
function slimNetscape(raw) {
	const kept = ["# Netscape HTTP Cookie File"];
	for (const line of raw.split(/\r?\n/)) {
		const t = line.trim();
		if (!t) continue;
		const httpOnly = t.startsWith("#HttpOnly_");
		const payload = httpOnly ? t.slice(10) : t;
		if (payload.startsWith("#")) continue;
		const parts = payload.split("	");
		if (parts.length < 7) continue;
		const name = parts[5] ?? "";
		const value = parts.slice(6).join("	");
		if (!keepYoutubeCookie(name, value)) continue;
		const row = `${parts[0]}\t${parts[1]}\t${parts[2]}\t${parts[3]}\t${parts[4]}\t${name}\t${value}`;
		kept.push(httpOnly ? `#HttpOnly_${row}` : row);
	}
	const keptNames = new Set(kept.slice(1).map((line) => {
		return (line.startsWith("#HttpOnly_") ? line.slice(10) : line).split("	")[5] ?? "";
	}));
	if (!keptNames.has("SID") && !keptNames.has("LOGIN_INFO") && !keptNames.has("__Secure-1PSID") && !keptNames.has("__Secure-3PSID")) throw new Error("В файле нет cookies входа на YouTube (SID / LOGIN_INFO). Экспортируйте cookies.txt, будучи авторизованы.");
	return `${kept.join("\n")}\n`;
}
function jsonCookies(text) {
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error("Не похоже на cookies.txt. Вставьте Netscape-файл или JSON экспорта.");
	}
	const list = cookieArray(parsed);
	if (!list) throw new Error("Не похоже на cookies.txt. Вставьте Netscape-файл или JSON экспорта.");
	return list.filter(isCookieRecord);
}
function cookieArray(parsed) {
	if (Array.isArray(parsed)) return parsed;
	if (parsed && typeof parsed === "object") {
		const rec = parsed;
		if (Array.isArray(rec.cookies)) return rec.cookies;
	}
	return null;
}
function isCookieRecord(item) {
	if (!item || typeof item !== "object") return false;
	const c = item;
	return Boolean(typeof c.name === "string" && c.name.length > 0 && typeof c.value === "string" && typeof c.domain === "string" && c.domain.length > 0);
}
function toNetscapeLine(c) {
	let domain = String(c.domain ?? "");
	const hostOnly = c.hostOnly === true;
	if (hostOnly) domain = domain.replace(/^\./, "");
	else if (!domain.startsWith(".") && domain.includes(".")) domain = `.${domain}`;
	const flag = hostOnly || !domain.startsWith(".") ? "FALSE" : "TRUE";
	const path = c.path || "/";
	const secure = c.secure ? "TRUE" : "FALSE";
	const exp = expiryUnix(c);
	const name = String(c.name ?? "");
	const value = String(c.value ?? "").replace(/[\r\n\t]/g, "");
	return `${c.httpOnly ? "#HttpOnly_" : ""}${domain}\t${flag}\t${path}\t${secure}\t${exp}\t${name}\t${value}`;
}
function expiryUnix(c) {
	if (c.session) return 0;
	const raw = typeof c.expirationDate === "number" ? c.expirationDate : typeof c.expires === "number" ? c.expires : typeof c.expires === "string" && /^\d+(\.\d+)?$/.test(c.expires) ? Number(c.expires) : 0;
	if (!Number.isFinite(raw) || raw <= 0) return 0;
	return raw > 0xe8d4a51000 ? Math.round(raw / 1e3) : Math.round(raw);
}
var execFileAsync = promisify(execFile);
var BROWSERS = [
	"chrome",
	"chromium",
	"firefox",
	"brave"
];
function pythonBin$1() {
	if (existsSync("/usr/bin/python3.11")) return "/usr/bin/python3.11";
	if (existsSync("/usr/local/bin/python3")) return "/usr/local/bin/python3";
	return "python3";
}
function ytDlpPath$1() {
	const candidates = [
		process.env.YT_DLP_PATH,
		path.join(process.cwd(), "bin/yt-dlp"),
		"/workspace/bin/yt-dlp"
	].filter((p) => Boolean(p));
	for (const candidate of candidates) if (existsSync(candidate)) return candidate;
	return null;
}
function cookiesFilePath() {
	const env = process.env.YTDLP_COOKIES;
	if (env) return env;
	return path.join(process.cwd(), "cookies.txt");
}
async function cookieStatus() {
	const file = cookiesFilePath();
	if (!existsSync(file)) return {
		present: false,
		count: 0
	};
	try {
		const text = await readFile(file, "utf8");
		const count = countCookieRows(text);
		return {
			present: count > 0 || text.trim().length > 0,
			count
		};
	} catch {
		return {
			present: false,
			count: 0
		};
	}
}
async function saveCookieFile(raw) {
	const normalized = normalizeCookieFile(raw);
	const count = countCookieRows(normalized);
	if (count === 0) throw new Error("В файле нет cookie-записей");
	const dest = cookiesFilePath();
	try {
		await writeFile(dest, normalized, {
			encoding: "utf8",
			mode: 384
		});
	} catch {}
	return {
		present: true,
		count
	};
}
async function clearCookieFile() {
	const dest = cookiesFilePath();
	if (existsSync(dest)) await unlink(dest).catch(() => {});
	return {
		present: false,
		count: 0
	};
}
function profileDirs(browser) {
	const home = os.homedir();
	switch (browser) {
		case "chrome": return [
			path.join(home, ".config/google-chrome"),
			path.join(home, "Library/Application Support/Google/Chrome"),
			path.join(home, "AppData/Local/Google/Chrome/User Data")
		];
		case "chromium": return [path.join(home, ".config/chromium"), path.join(home, "Library/Application Support/Chromium")];
		case "firefox": return [
			path.join(home, ".mozilla/firefox"),
			path.join(home, "Library/Application Support/Firefox"),
			path.join(home, "AppData/Roaming/Mozilla/Firefox")
		];
		case "brave": return [
			path.join(home, ".config/BraveSoftware/Brave-Browser"),
			path.join(home, "Library/Application Support/BraveSoftware/Brave-Browser"),
			path.join(home, "AppData/Local/BraveSoftware/Brave-Browser/User Data")
		];
	}
}
function browsersWithProfile() {
	return BROWSERS.filter((browser) => profileDirs(browser).some((dir) => existsSync(dir)));
}
async function exportFromBrowser() {
	const bin = ytDlpPath$1();
	if (!bin) throw new Error("yt-dlp не установлен — откройте «Установка».");
	const py = pythonBin$1();
	const available = browsersWithProfile();
	if (available.length === 0) throw new Error("На этой машине нет профиля Chrome / Firefox / Brave. Вставьте cookies.txt в поле.");
	const tmp = path.join(os.tmpdir(), `octava-browser-cookies-${process.pid}.txt`);
	for (const browser of available) try {
		await execFileAsync(py, [
			bin,
			"--js-runtimes",
			"node",
			"--no-warnings",
			"--skip-download",
			"--ignore-no-formats-error",
			"--cookies-from-browser",
			browser,
			"--cookies",
			tmp,
			"https://www.youtube.com/"
		], {
			timeout: 8e3,
			maxBuffer: 2097152
		});
		if (!existsSync(tmp)) continue;
		const text = await readFile(tmp, "utf8");
		await unlink(tmp).catch(() => {});
		return {
			...await saveCookieFile(text),
			browser
		};
	} catch {
		await unlink(tmp).catch(() => {});
	}
	throw new Error("Не удалось взять cookies из браузера на этой машине. Вставьте cookies.txt в поле.");
}
var MAX_LINES = 180;
var MAX_LINE = 500;
var seq = 0;
var lines = [];
var lastProgress = 0;
var lastProgressBucket = -1;
var DOWNLOAD_PCT = /\[download\]\s+(\d+(?:\.\d+)?)%/;
var RELOAD_LINE = /please reload|reload this page|reload the page|needs to be reloaded|page needs to be reload/i;
var BOT_LINE = /sign in to confirm|not a bot/i;
var NO_FORMAT_LINE = /requested format is not available/i;
function sanitizeLog(raw) {
	return humanizeYtLog(raw.replace(/\u001b\[[0-9;]*m/g, "").replace(/\b(SID|HSID|SSID|APISID|SAPISID|__Secure-[A-Za-z0-9_-]+|LOGIN_INFO|VISITOR_INFO1_LIVE|YSC|PREF|CONSENT|SESSION_TOKEN)=[^\s;]*/gi, "$1=***").replace(/#HttpOnly_[^\n]*/g, "#HttpOnly_***").replace(/Cookie:\s*[^\n]+/gi, "Cookie: ***").replace(/--cookies(?:-from-browser)?\s+\S+/gi, "--cookies ***"));
}
function humanizeYtLog(raw) {
	return raw.split(/\r?\n/).map((line) => {
		const yt = line.match(/^(ERROR:\s*\[youtube\]\s*\S+:\s*)([\s\S]*)$/i);
		if (yt && (BOT_LINE.test(line) || RELOAD_LINE.test(line) || NO_FORMAT_LINE.test(line))) {
			const prefix = yt[1] ?? "";
			if (BOT_LINE.test(line)) return `${prefix}YouTube просит cookies входа (проверка на бота)`;
			if (NO_FORMAT_LINE.test(line)) return `${prefix}нет подходящего аудиоформата — пробуем другой`;
			return `${prefix}сессия cookies сброшена — загрузите свежий cookies.txt`;
		}
		if (BOT_LINE.test(line)) return "YouTube просит cookies входа (проверка на бота)";
		if (RELOAD_LINE.test(line)) return line.replace(/The page needs to be reloaded\.?/gi, "сессия cookies сброшена").replace(/Please reload this page\.?/gi, "обновите cookies YouTube").replace(/reload the page\.?/gi, "обновите cookies YouTube");
		return line;
	}).join("\n");
}
function classify(text) {
	if (/ERROR:/i.test(text) || /HTTP Error\s+4\d\d/i.test(text)) return "error";
	if (/WARNING:/i.test(text) || /Deprecated Feature/i.test(text)) return "warn";
	if (/Destination:|has already been downloaded/i.test(text)) return "ok";
	return "info";
}
function getDownloadProgress() {
	return lastProgress;
}
function resetProgress() {
	lastProgress = 0;
	lastProgressBucket = -1;
}
function applyDownloadProgress(text) {
	const match = text.match(DOWNLOAD_PCT);
	if (match) {
		const pct = Math.max(0, Math.min(Number(match[1]) / 100, 1));
		lastProgress = pct;
		const bucket = Math.floor(pct * 20);
		if (bucket === lastProgressBucket && pct < 1) return true;
		lastProgressBucket = bucket;
		return false;
	}
	if (/скачивание\s/i.test(text)) {
		resetProgress();
		return false;
	}
	if (/Destination:|ExtractAudio|has already been downloaded/i.test(text)) lastProgress = Math.max(lastProgress, .92);
	if (/готово\s/i.test(text)) lastProgress = 1;
	return false;
}
function appendLog(level, raw, opts) {
	const text = sanitizeLog(raw).replace(/\s+/g, " ").trim().slice(0, MAX_LINE);
	if (!text) return;
	if (!opts?.skipProgress && applyDownloadProgress(text) && level === "info") return;
	seq += 1;
	lines.push({
		id: seq,
		t: Date.now(),
		level,
		text
	});
	if (lines.length > MAX_LINES) lines.splice(0, lines.length - MAX_LINES);
}
function feedLogChunk(chunk, carry) {
	const parts = (carry.buf + chunk).split(/\r?\n|\r/);
	carry.buf = parts.pop() ?? "";
	for (const part of parts) {
		const text = sanitizeLog(part).trim();
		if (!text) continue;
		if (applyDownloadProgress(text) && !/ERROR:|WARNING:/i.test(text)) continue;
		appendLog(classify(text), text, { skipProgress: true });
	}
}
function flushLogCarry(carry) {
	const text = sanitizeLog(carry.buf).trim();
	carry.buf = "";
	if (text) appendLog(classify(text), text);
}
function listLog(after = 0) {
	if (after <= 0) return lines.slice();
	return lines.filter((line) => line.id > after);
}
function dumpLogText(limit = 40) {
	return lines.slice(-limit).map((line) => line.text).join("\n");
}
function clearLog() {
	lines.length = 0;
	resetProgress();
}
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
	const ck = await cookieStatus();
	return {
		ytdlp,
		ffmpeg,
		python: pythonBin(),
		cookies: ck.present,
		cookieCount: ck.count
	};
}
function baseArgs(cookieFile) {
	const args = [
		"--js-runtimes",
		"node",
		"--no-check-certificates",
		"--newline",
		"--extractor-args",
		"youtube:player_client=default,-tv_downgraded"
	];
	const file = cookieFile === void 0 ? cookiesPath() : cookieFile;
	if (file) args.push("--cookies", file);
	return args;
}
async function withCookieFile(raw, fn) {
	const text = raw?.trim();
	if (!text) return fn(cookiesPath());
	let normalized;
	try {
		normalized = normalizeCookieFile(text);
	} catch {
		throw new ExtractorError("BAD_COOKIES", "Не похоже на cookies.txt. Вставьте Netscape-файл или JSON экспорта.");
	}
	const dir = await mkdtemp(path.join(os.tmpdir(), "octava-ck-"));
	const file = path.join(dir, "cookies.txt");
	await writeFile(file, normalized, {
		encoding: "utf8",
		mode: 384
	});
	try {
		return await fn(file);
	} finally {
		await rm(dir, {
			recursive: true,
			force: true
		});
	}
}
async function runYtDlp(extraArgs, cookieFile, timeoutMs, collectStdout) {
	const bin = ytDlpPath();
	if (!bin) throw new ExtractorError("MISSING_YTDLP", "yt-dlp не установлен. Откройте раздел «Установка» и запустите скрипт.");
	const py = pythonBin();
	const args = [
		bin,
		...baseArgs(cookieFile),
		...extraArgs
	];
	return new Promise((resolve, reject) => {
		const child = spawn(py, args, {
			env: {
				...process.env,
				PYTHONUNBUFFERED: "1"
			},
			stdio: [
				"ignore",
				collectStdout ? "pipe" : "ignore",
				"pipe"
			]
		});
		let stdout = "";
		let stderr = "";
		const carry = { buf: "" };
		let killed = false;
		const timer = setTimeout(() => {
			killed = true;
			child.kill("SIGKILL");
		}, timeoutMs);
		if (child.stdout) child.stdout.on("data", (chunk) => {
			stdout += chunk.toString("utf8");
			if (stdout.length > 16777216) stdout = stdout.slice(-8388608);
		});
		child.stderr?.on("data", (chunk) => {
			const text = chunk.toString("utf8");
			stderr += text;
			if (stderr.length > 64e3) stderr = stderr.slice(-48e3);
			feedLogChunk(text, carry);
		});
		child.on("error", (err) => {
			clearTimeout(timer);
			reject(err);
		});
		child.on("close", (code) => {
			clearTimeout(timer);
			flushLogCarry(carry);
			resolve({
				code,
				stdout,
				stderr,
				killed
			});
		});
	});
}
async function runJson(args, cookieFile) {
	try {
		const proc = await runYtDlp(args, cookieFile ?? null, JSON_TIMEOUT_MS, true);
		if (proc.killed) throw Object.assign(/* @__PURE__ */ new Error("yt-dlp timeout"), {
			killed: true,
			stderr: proc.stderr
		});
		if (proc.code !== 0) throw Object.assign(/* @__PURE__ */ new Error("yt-dlp failed"), {
			code: proc.code,
			stderr: proc.stderr,
			stdout: proc.stdout
		});
		const trimmed = proc.stdout.trim();
		if (!trimmed) throw new ExtractorError("EMPTY", "YouTube вернул пустой ответ.", proc.stderr);
		return JSON.parse(trimmed);
	} catch (err) {
		if (err instanceof ExtractorError) throw err;
		throw mapExecError(err);
	}
}
var ExtractorError = class extends Error {
	code;
	log;
	constructor(code, message, log = "") {
		super(message);
		this.code = code;
		this.name = "ExtractorError";
		this.log = sanitizeLog(log);
		appendLog("error", message);
	}
};
function mapExecError(err) {
	const anyErr = err;
	const stderr = sanitizeLog(anyErr.stderr ?? "");
	const blob = `${stderr} ${anyErr.stdout ?? ""} ${anyErr.message ?? ""}`;
	let mapped;
	if (/playlist does not exist/i.test(blob)) mapped = new ExtractorError("NOT_FOUND", "Такого плейлиста нет или он закрыт.", stderr);
	else if (/video unavailable|private video|this video is not available/i.test(blob)) mapped = new ExtractorError("UNAVAILABLE", "Ролик недоступен, удалён или скрыт.", stderr);
	else if (/sign in to confirm|not a bot/i.test(blob)) mapped = new ExtractorError("BOTCHECK", "YouTube просит подтвердить, что вы не бот. Вставьте cookies YouTube в поле на главной — после согласия.", stderr);
	else if (/please reload|reload this page|reload the page|needs to be reloaded|page needs to be reload/i.test(blob)) mapped = new ExtractorError("SESSION", "YouTube сбросил сессию cookies. Экспортируйте свежий cookies.txt на youtube.com и загрузите его снова.", stderr);
	else if (/requested format is not available/i.test(blob)) mapped = new ExtractorError("NO_FORMAT", "Для этого ролика нет подходящей аудиодорожки. Попробуйте формат «как есть» или обновите cookies.", stderr);
	else if (/ffmpeg exited with code -?11|signal 11|SIGSEGV/i.test(blob)) mapped = new ExtractorError("FFMPEG", "ffmpeg не смог перекодировать этот файл. Попробуйте формат M4A или «как есть».", stderr);
	else if (/HTTP Error 403|403: Forbidden/i.test(blob)) mapped = new ExtractorError("YOUTUBE_BLOCKED", "YouTube отклонил загрузку с этого сервера. Добавьте cookies YouTube в поле на главной или запустите скрипт установки у себя.", stderr);
	else if (anyErr.killed) mapped = new ExtractorError("TIMEOUT", "YouTube слишком долго отвечает. Попробуйте ещё раз.", stderr);
	else mapped = new ExtractorError("EXTRACT", blob.split("\n").map((l) => l.trim()).find((l) => l.startsWith("ERROR:"))?.replace(/^ERROR:\s*/i, "") || "Не удалось разобрать ссылку.", stderr);
	return mapped;
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
async function resolveInput(raw, cookiesText) {
	appendLog("info", `запрос: ${raw.trim().slice(0, 180)}`);
	try {
		const result = await withCookieFile(cookiesText, (cookieFile) => resolveWith(raw, cookieFile));
		if (result.kind === "video") appendLog("ok", `ролик: ${result.track.title}`);
		else if (result.kind === "playlist") appendLog("ok", `плейлист «${result.title}» · ${result.tracks.length} треков`);
		else appendLog("ok", `поиск «${result.query}» · ${result.tracks.length} результатов`);
		return result;
	} catch (err) {
		if (err instanceof ExtractorError) throw err;
		throw mapExecError(err);
	}
}
async function resolveWith(raw, cookieFile) {
	const parsed = parseYoutubeInput(raw);
	if (parsed.kind === "empty") throw new ExtractorError("EMPTY", "Вставьте ссылку или поисковый запрос.");
	if (parsed.kind === "search") {
		const tracks = ((await runJson([
			"-J",
			"--flat-playlist",
			"--playlist-end",
			"8",
			toYtdlpTarget(parsed)
		], cookieFile)).entries ?? []).map(asTrack).filter((t) => Boolean(t));
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
		], cookieFile);
		const tracks = (data.entries ?? []).map(asTrack).filter((t) => Boolean(t));
		if (tracks.length === 0 && parsed.kind === "video") return resolveVideo(parsed.videoId, cookieFile);
		return {
			kind: "playlist",
			id: data.playlist_id || playlistId,
			title: data.title || data.playlist_title || "Плейлист",
			channel: data.uploader || data.channel || "",
			tracks
		};
	}
	return resolveVideo(parsed.videoId, cookieFile);
}
async function resolveVideo(videoId, cookieFile) {
	const track = asTrack(await runJson([
		"-J",
		"--no-playlist",
		"--skip-download",
		watchUrl(videoId)
	], cookieFile));
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
function formatAttempts(format, quality) {
	if (format === "mp3") return [[
		"-f",
		"bestaudio/best",
		"-x",
		"--audio-format",
		"mp3",
		"--audio-quality",
		mp3FfmpegQuality(quality)
	], [
		"-f",
		"ba/b",
		"-x",
		"--audio-format",
		"mp3",
		"--audio-quality",
		mp3FfmpegQuality(quality)
	]];
	if (format === "m4a") return [
		[
			"-f",
			"bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio/best",
			"-x",
			"--audio-format",
			"m4a"
		],
		["-f", "ba[ext=m4a]/ba/b"],
		["-f", "ba/b"]
	];
	return [["-f", "ba[ext=m4a]/ba/b"], ["-f", "ba/b"]];
}
function isRetryableFormatError(stderr) {
	return /requested format is not available/i.test(stderr);
}
async function extractAudio(videoId, format, cookiesText, quality = "192") {
	if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new ExtractorError("BAD_ID", "Некорректный идентификатор ролика.");
	if (!ytDlpPath()) throw new ExtractorError("MISSING_YTDLP", "yt-dlp не установлен. Откройте раздел «Установка».");
	return withCookieFile(cookiesText, (cookieFile) => withSlot(async () => {
		const dir = await mkdtemp(path.join(os.tmpdir(), "octava-"));
		const outTpl = path.join(dir, "%(id)s.%(ext)s");
		appendLog("info", format === "mp3" ? `скачивание ${videoId} · mp3 ${quality}k` : `скачивание ${videoId} · ${format}`);
		const attempts = formatAttempts(format, quality);
		let lastFail = null;
		for (let i = 0; i < attempts.length; i++) {
			const args = [
				...attempts[i],
				"--no-playlist",
				"--no-part",
				"--no-mtime",
				"-o",
				outTpl,
				"--",
				watchUrl(videoId)
			];
			try {
				const proc = await runYtDlp(args, cookieFile, DOWNLOAD_TIMEOUT_MS, false);
				if (proc.killed) {
					lastFail = proc;
					break;
				}
				if (proc.code === 0) {
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
				await rm(dir, {
					recursive: true,
					force: true
				}).catch(() => {});
				if (err instanceof ExtractorError) throw err;
				throw mapExecError(err);
			}
		}
		if (lastFail) {
			await rm(dir, {
				recursive: true,
				force: true
			}).catch(() => {});
			throw mapExecError(Object.assign(/* @__PURE__ */ new Error("yt-dlp failed"), {
				killed: lastFail.killed,
				code: lastFail.code,
				stderr: lastFail.stderr
			}));
		}
		const audio = (await readdir(dir)).filter((f) => !f.endsWith(".part"))[0];
		if (!audio) {
			await rm(dir, {
				recursive: true,
				force: true
			}).catch(() => {});
			throw new ExtractorError("EMPTY_FILE", "Файл не был сохранён.");
		}
		const filePath = path.join(dir, audio);
		const info = await stat(filePath);
		if (info.size < 256) {
			await rm(dir, {
				recursive: true,
				force: true
			}).catch(() => {});
			throw new ExtractorError("YOUTUBE_BLOCKED", "YouTube отклонил загрузку с этого сервера. Добавьте cookies YouTube или запустите установщик у себя.");
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
				await rm(dir, {
					recursive: true,
					force: true
				}).catch(() => {});
			}
		};
	}));
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
	const status = mapped.code === "MISSING_YTDLP" ? 503 : mapped.code === "NOT_FOUND" || mapped.code === "UNAVAILABLE" ? 404 : mapped.code === "BAD_ID" || mapped.code === "EMPTY" || mapped.code === "BAD_COOKIES" ? 400 : 502;
	const log = mapped.log || dumpLogText(40);
	return Response.json({
		code: mapped.code,
		message: mapped.message,
		log
	}, { status });
}
//#endregion
export { parseMp3Quality as C, streamAudioFile as D, saveCookieFile as E, normalizeCookieFile as S, safeFilename as T, getCaps as _, blobKey as a, listLog as b, cookieCountLabel as c, errorResponse as d, exportFromBrowser as f, formatDuration as g, formatBytes as h, MP3_QUALITY_LABEL as i, countCookieRows as l, extractAudio as m, FORMAT_LABEL as n, clearCookieFile as o, extensionFor as p, MP3_QUALITIES as r, clearLog as s, ExtractorError as t, dumpLogText as u, getDownloadProgress as v, resolveInput as w, newId as x, isLikelyCookieFile as y };
