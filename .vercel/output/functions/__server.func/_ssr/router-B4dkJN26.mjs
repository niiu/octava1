import { i as __toESM } from "../_runtime.mjs";
import { A as streamSavedFile, C as newId, D as safeFilename, S as mimeFor, T as parseMp3Quality, d as errorResponse, k as streamAudioFile, m as extractAudio, p as extensionFor, t as ExtractorError, v as getDownloadProgress } from "./extractor.server-RF0ebCYR.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as createRouter, g as createRootRoute, h as createFileRoute, l as Scripts, m as lazyRouteComponent, p as Outlet, u as HeadContent, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { m as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { a as string, i as object, n as literal, o as union, r as number } from "../_libs/zod.mjs";
import { r as TriangleAlert } from "../_libs/lucide-react.mjs";
import { n as Portal, r as Provider, t as Content2 } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { copyFile, readFile, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
//#region node_modules/.nitro/vite/services/ssr/assets/router-B4dkJN26.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function AppErrorComponent({ error, reset }) {
	const message = error instanceof Error && error.message.trim() ? error.message : "Неожиданная ошибка. Вернитесь на главную и попробуйте снова.";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-danger",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl tracking-tight",
				children: "Что-то сломалось"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted",
				children: message
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-2 h-10 rounded-md bg-fg px-4 text-sm text-bg",
				onClick: () => {
					if (typeof reset === "function") reset();
					else window.location.assign("/");
				},
				children: "На главную"
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var TooltipProvider = Provider;
var TooltipContent = import_react.forwardRef(({ className, sideOffset = 6, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 rounded-sm bg-raised px-2.5 py-1.5 text-xs text-fg shadow-[var(--shadow-border)]", className),
	...props
}) }));
TooltipContent.displayName = Content2.displayName;
var styles_default = "/assets/styles-DYKicUj8.css";
var APP_NAME = "Octava";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Octava — загрузчик аудио с YouTube. Ролики, плейлисты, ZIP и своя веб-морда."
			},
			{
				name: "theme-color",
				content: "#0e0f0d"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Outfit:wght@400;500;600&display=swap"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "ru",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, {
					delayDuration: 250,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "dark",
					position: "top-center",
					toastOptions: { className: "!bg-surface !text-fg !border-0 !shadow-[0_0_0_1px_rgba(240,238,230,0.08)]" }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$1 = () => import("./routes-BNeGgzwE.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./install-CQRvNqit.mjs");
var Route$2 = createFileRoute("/install")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var FORMATS$1 = /* @__PURE__ */ new Set([
	"m4a",
	"mp3",
	"source"
]);
function parseFormat$1(raw) {
	const formatRaw = raw ?? "m4a";
	return FORMATS$1.has(formatRaw) ? formatRaw : "m4a";
}
async function handleAudio(id, format, cookies, quality) {
	const file = await extractAudio(id, format, cookies, quality);
	return streamAudioFile(file);
}
var Route$1 = createFileRoute("/api/audio")({ server: { handlers: {
	GET: async ({ request }) => {
		const url = new URL(request.url);
		const id = url.searchParams.get("id") ?? "";
		const format = parseFormat$1(url.searchParams.get("format"));
		const quality = parseMp3Quality(url.searchParams.get("quality"));
		try {
			return await handleAudio(id, format, void 0, quality);
		} catch (err) {
			return errorResponse(err);
		}
	},
	POST: async ({ request }) => {
		try {
			const body = await request.json();
			return await handleAudio(typeof body.id === "string" ? body.id : "", parseFormat$1(typeof body.format === "string" ? body.format : "m4a"), typeof body.cookies === "string" ? body.cookies : void 0, parseMp3Quality(body.quality));
		} catch (err) {
			return errorResponse(err);
		}
	}
} } });
var jobs = /* @__PURE__ */ new Map();
var cookiesByJob = /* @__PURE__ */ new Map();
var controllers = /* @__PURE__ */ new Map();
var loaded = false;
var persistTimer = null;
var jobsDir = "";
var MAX_JOBS = 40;
function publicJob(job) {
	return {
		jobId: job.jobId,
		videoId: job.videoId,
		title: job.title,
		format: job.format,
		quality: job.quality,
		status: job.status,
		progress: job.progress,
		error: job.error,
		filename: job.filename,
		mime: job.mime,
		bytes: job.bytes,
		createdAt: job.createdAt,
		updatedAt: job.updatedAt
	};
}
function resolveDir() {
	const preferred = process.env.OCTAVA_DATA || path.join(process.cwd(), "data", "jobs");
	try {
		mkdirSync(preferred, { recursive: true });
		return preferred;
	} catch {
		const fallback = path.join(os.tmpdir(), "octava-jobs");
		mkdirSync(fallback, { recursive: true });
		return fallback;
	}
}
function indexPath() {
	return path.join(jobsDir, "index.json");
}
async function ensureLoaded() {
	if (loaded) return;
	loaded = true;
	jobsDir = resolveDir();
	try {
		const raw = await readFile(indexPath(), "utf8");
		const parsed = JSON.parse(raw);
		for (const job of parsed.jobs ?? []) {
			if (!job?.jobId) continue;
			if (job.status === "queued" || job.status === "running") {
				if (job.filePath && existsSync(job.filePath)) {
					const info = await stat(job.filePath).catch(() => null);
					if (info && info.size >= 4096) {
						job.status = "done";
						job.progress = 1;
						job.bytes = info.size;
					} else {
						job.status = "error";
						job.error = "прервано при перезапуске службы — нажмите скачать снова";
					}
				} else {
					job.status = "error";
					job.error = "прервано при перезапуске службы — нажмите скачать снова";
				}
				job.updatedAt = Date.now();
			}
			jobs.set(job.jobId, job);
		}
	} catch {}
}
function schedulePersist() {
	if (persistTimer) return;
	persistTimer = setTimeout(() => {
		persistTimer = null;
		const payload = JSON.stringify({ jobs: [...jobs.values()] });
		writeFile(indexPath(), payload, "utf8").catch(() => void 0);
	}, 250);
}
function patch(jobId, partial) {
	const job = jobs.get(jobId);
	if (!job) return null;
	Object.assign(job, partial, { updatedAt: Date.now() });
	schedulePersist();
	return job;
}
function reuseKey(videoId, format, quality) {
	return `${videoId}::${format}::${quality}`;
}
function findReusable(videoId, format, quality) {
	const key = reuseKey(videoId, format, quality);
	let best;
	for (const job of jobs.values()) {
		if (reuseKey(job.videoId, job.format, job.quality) !== key) continue;
		if (job.status === "running" || job.status === "queued") return job;
		if (job.status === "done" && job.filePath && existsSync(job.filePath)) best = job;
	}
	return best;
}
async function prune() {
	if (jobs.size <= MAX_JOBS) return;
	const idle = [...jobs.values()].filter((j) => j.status === "done" || j.status === "error" || j.status === "cancelled").sort((a, b) => a.updatedAt - b.updatedAt);
	while (jobs.size > MAX_JOBS && idle.length > 0) {
		const old = idle.shift();
		if (!old) break;
		if (old.filePath) await unlink(old.filePath).catch(() => void 0);
		jobs.delete(old.jobId);
	}
	schedulePersist();
}
async function runJob(jobId) {
	const job = jobs.get(jobId);
	if (!job) return;
	const ac = controllers.get(jobId);
	patch(jobId, {
		status: "running",
		progress: .03
	});
	const tick = setInterval(() => {
		const current = jobs.get(jobId);
		if (!current || current.status !== "running") return;
		patch(jobId, { progress: Math.max(current.progress, getDownloadProgress() || .03) });
	}, 400);
	try {
		const file = await extractAudio(job.videoId, job.format, cookiesByJob.get(jobId), job.quality, ac?.signal);
		const ext = path.extname(file.path) || `.${extensionFor(job.format, file.mime)}`;
		const dest = path.join(jobsDir, `${job.jobId}${ext}`);
		await copyFile(file.path, dest);
		const info = await stat(dest);
		await file.cleanup().catch(() => void 0);
		patch(jobId, {
			status: "done",
			progress: 1,
			filePath: dest,
			filename: `${safeFilename(job.title)}.${ext.replace(/^\./, "")}`,
			mime: file.mime || mimeFor(job.format),
			bytes: info.size
		});
	} catch (err) {
		if (ac?.signal.aborted) {
			patch(jobId, {
				status: "cancelled",
				error: "отменено",
				progress: 0
			});
			return;
		}
		const mapped = err instanceof ExtractorError ? err : null;
		patch(jobId, {
			status: "error",
			error: mapped?.message || (err instanceof Error ? err.message : "не скачался")
		});
		if (mapped?.log) {}
	} finally {
		clearInterval(tick);
		cookiesByJob.delete(jobId);
		controllers.delete(jobId);
		await prune();
	}
}
async function listJobs() {
	await ensureLoaded();
	return [...jobs.values()].sort((a, b) => b.updatedAt - a.updatedAt).map(publicJob);
}
async function getJob(jobId) {
	await ensureLoaded();
	const job = jobs.get(jobId);
	return job ? publicJob(job) : null;
}
async function startJob(input) {
	await ensureLoaded();
	const quality = input.quality ?? "192";
	const existing = findReusable(input.videoId, input.format, quality);
	if (existing) return publicJob(existing);
	const jobId = newId("job");
	const now = Date.now();
	const job = {
		jobId,
		videoId: input.videoId,
		title: (input.title || input.videoId).trim() || input.videoId,
		format: input.format,
		quality,
		status: "queued",
		progress: 0,
		createdAt: now,
		updatedAt: now
	};
	jobs.set(jobId, job);
	cookiesByJob.set(jobId, input.cookies);
	const ac = new AbortController();
	controllers.set(jobId, ac);
	schedulePersist();
	runJob(jobId);
	return publicJob(job);
}
async function cancelJob(jobId) {
	await ensureLoaded();
	const job = jobs.get(jobId);
	if (!job) return null;
	if (job.status === "done") return publicJob(job);
	controllers.get(jobId)?.abort();
	patch(jobId, {
		status: "cancelled",
		error: "отменено"
	});
	cookiesByJob.delete(jobId);
	return publicJob(jobs.get(jobId));
}
async function streamJobFile(jobId) {
	await ensureLoaded();
	const job = jobs.get(jobId);
	if (!job || job.status !== "done" || !job.filePath || !existsSync(job.filePath)) return Response.json({
		code: "NOT_FOUND",
		message: "Файл ещё не готов."
	}, { status: 404 });
	return streamSavedFile(job.filePath, job.filename || `${safeFilename(job.title)}.${extensionFor(job.format)}`, job.mime || mimeFor(job.format));
}
var FORMATS = /* @__PURE__ */ new Set([
	"m4a",
	"mp3",
	"source"
]);
function parseFormat(raw) {
	const value = typeof raw === "string" ? raw : "m4a";
	return FORMATS.has(value) ? value : "m4a";
}
var Route = createFileRoute("/api/job")({ server: { handlers: {
	GET: async ({ request }) => {
		const url = new URL(request.url);
		const id = url.searchParams.get("id") ?? "";
		if (url.searchParams.get("download") && id) return streamJobFile(id);
		if (id) {
			const job = await getJob(id);
			if (!job) return Response.json({
				code: "NOT_FOUND",
				message: "Нет такого задания"
			}, { status: 404 });
			return Response.json({ job });
		}
		return Response.json({ jobs: await listJobs() });
	},
	POST: async ({ request }) => {
		try {
			const body = await request.json();
			const videoId = typeof body.videoId === "string" ? body.videoId : typeof body.id === "string" ? body.id : "";
			if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return Response.json({
				code: "BAD_ID",
				message: "Некорректный идентификатор ролика."
			}, { status: 400 });
			const job = await startJob({
				videoId,
				title: typeof body.title === "string" ? body.title : videoId,
				format: parseFormat(body.format),
				quality: parseMp3Quality(body.quality),
				cookies: typeof body.cookies === "string" ? body.cookies : void 0
			});
			return Response.json({ job });
		} catch (err) {
			return Response.json({
				code: "JOB",
				message: err instanceof Error ? err.message : "Не удалось создать задание"
			}, { status: 500 });
		}
	},
	DELETE: async ({ request }) => {
		const id = new URL(request.url).searchParams.get("id") ?? "";
		if (!id) return Response.json({
			code: "BAD_ID",
			message: "Нет id задания"
		}, { status: 400 });
		const job = await cancelJob(id);
		if (!job) return Response.json({
			code: "NOT_FOUND",
			message: "Нет такого задания"
		}, { status: 404 });
		return Response.json({ job });
	}
} } });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	InstallRoute: Route$2.update({
		id: "/install",
		path: "/install",
		getParentRoute: () => Route$4
	}),
	ApiAudioRoute: Route$1.update({
		id: "/api/audio",
		path: "/api/audio",
		getParentRoute: () => Route$4
	}),
	ApiJobRoute: Route.update({
		id: "/api/job",
		path: "/api/job",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { cn as n, router_exports as t };
