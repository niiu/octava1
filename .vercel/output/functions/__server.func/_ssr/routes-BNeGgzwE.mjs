import { i as __toESM } from "../_runtime.mjs";
import { C as newId, D as safeFilename, a as blobKey, b as isLikelyCookieFile, c as cookieCountLabel, g as formatDuration, h as formatBytes, i as MP3_QUALITY_LABEL, l as countCookieRows, n as FORMAT_LABEL, p as extensionFor, r as MP3_QUALITIES, w as normalizeCookieFile } from "./extractor.server-RF0ebCYR.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { m as require_jsx_runtime, n as CheckboxIndicator, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { a as string, i as object, n as literal, t as number } from "../_libs/zod.mjs";
import { S as Archive, _ as Download, a as Terminal, b as ChevronDown, c as Plus, d as Minus, f as LoaderCircle, g as FileUp, h as FolderPlus, i as Trash2, l as Play, m as History, n as X, o as Search, p as ListMusic, s as Save, t as Youtube, u as Pause, v as Copy, x as Check, y as Cookie } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as cn } from "./router-B4dkJN26.mjs";
import { n as Wordmark, t as Button } from "./logo-DE_kUQj5.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as Root, t as Indicator } from "../_libs/radix-ui__react-progress.mjs";
import { t as Root$1 } from "../_libs/radix-ui__react-separator.mjs";
import { t as require_lib } from "../_libs/jszip+[...].mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BNeGgzwE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_lib = /* @__PURE__ */ __toESM(require_lib());
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("peer group size-5 shrink-0 rounded-xs border border-line bg-raised text-bg shadow-[var(--shadow-border)]", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70", "data-[state=checked]:border-fg data-[state=checked]:bg-fg data-[state=checked]:text-bg", "data-[state=indeterminate]:border-fg data-[state=indeterminate]:bg-fg data-[state=indeterminate]:text-bg", "disabled:cursor-not-allowed disabled:opacity-40", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CheckboxIndicator, {
		className: "flex items-center justify-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
			className: "hidden size-3.5 group-data-[state=indeterminate]:block",
			strokeWidth: 2.5
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
			className: "size-3.5 group-data-[state=indeterminate]:hidden",
			strokeWidth: 2.5
		})]
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-bg/80 data-[state=open]:animate-in data-[state=closed]:animate-out", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed top-1/2 left-4 right-4 z-50 -translate-y-1/2 rounded-xl bg-surface p-5 text-fg shadow-[var(--shadow-border)] sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute top-3 right-3 rounded-sm p-2 text-muted hover:bg-raised hover:text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Закрыть"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
function DialogHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("mb-4 space-y-1 pr-8", className),
		...props
	});
}
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("font-display text-xl leading-snug tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var Input = import_react.forwardRef(({ className, type = "text", ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-12 w-full rounded-md bg-raised px-4 text-base text-fg shadow-[var(--shadow-border)] transition-[box-shadow] duration-[var(--motion-quick)] placeholder:text-subtle", "focus-visible:outline-none focus-visible:shadow-[var(--shadow-border-hover)] focus-visible:ring-2 focus-visible:ring-accent/60", "disabled:cursor-not-allowed disabled:opacity-50", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var Progress = import_react.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("relative h-2 w-full overflow-hidden rounded-full bg-line", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Indicator, {
		className: "h-full bg-accent transition-[transform] duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)]",
		style: { transform: `translateX(-${100 - (value ?? 0)}%)` }
	})
}));
Progress.displayName = Root.displayName;
var Separator = import_react.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root$1, {
	ref,
	decorative,
	orientation,
	className: cn("shrink-0 bg-line", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className),
	...props
}));
Separator.displayName = Root$1.displayName;
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-24 w-full rounded-md bg-raised px-4 py-3 font-mono text-xs leading-relaxed text-fg shadow-[var(--shadow-border)] transition-[box-shadow] duration-[var(--motion-quick)] placeholder:text-subtle", "focus-visible:outline-none focus-visible:shadow-[var(--shadow-border-hover)] focus-visible:ring-2 focus-visible:ring-accent/60", "disabled:cursor-not-allowed disabled:opacity-50", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var CONSENT_KEY = "octava-yt-cookies-consent";
var COOKIES_KEY = "octava-yt-cookies";
function loadCookieConsent() {
	try {
		return localStorage.getItem(CONSENT_KEY) === "1";
	} catch {
		return false;
	}
}
function saveCookieConsent(ok) {
	try {
		if (ok) localStorage.setItem(CONSENT_KEY, "1");
		else localStorage.removeItem(CONSENT_KEY);
	} catch {}
}
function loadStoredCookies() {
	try {
		return localStorage.getItem(COOKIES_KEY) ?? "";
	} catch {
		return "";
	}
}
function saveStoredCookies(raw) {
	try {
		const text = raw.trim();
		if (!text) {
			localStorage.removeItem(COOKIES_KEY);
			return;
		}
		let stored = text;
		try {
			stored = normalizeCookieFile(text);
		} catch {}
		localStorage.setItem(COOKIES_KEY, stored);
	} catch {}
}
function clearStoredCookies() {
	try {
		localStorage.removeItem(COOKIES_KEY);
	} catch {}
}
function cookiePayload(field) {
	const raw = (field.trim() || loadStoredCookies()).trim();
	if (!raw) return void 0;
	try {
		return normalizeCookieFile(raw);
	} catch {
		return raw;
	}
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var inputSchema = object({
	input: string().trim().min(1, "Вставьте ссылку или запрос").max(500),
	cookies: string().max(2e5).optional()
});
var getExtractorCaps = createServerFn({ method: "GET" }).handler(createSsrRpc("76b99b627836fa9ae6745eafd568542168a86d786d5abd33801d69699fa5d02a"));
var getExtractorLog = createServerFn({ method: "POST" }).validator(object({ after: number().int().nonnegative().optional() })).handler(createSsrRpc("471041d278f466bbbcd911e755bffb17b696a719a103b0c38afabd3b26143b21"));
var clearExtractorLog = createServerFn({ method: "POST" }).handler(createSsrRpc("fa1365f86a87bf5ba813312150f394883694e110e7e93bd7ed294ffe3257599f"));
var resolveMedia = createServerFn({ method: "POST" }).validator(inputSchema).handler(createSsrRpc("7e356af630bd8842a70e21ae4d5acf69fbaf908febfd6b21f4ee151cf81033db"));
var saveYoutubeCookies = createServerFn({ method: "POST" }).validator(object({ cookies: string().min(8).max(2e5) })).handler(createSsrRpc("6e5565706d3911bd6e2e3cfd69c38da374a83ee36be0a91b2ad7e105e7eb0184"));
var clearYoutubeCookies = createServerFn({ method: "POST" }).handler(createSsrRpc("a21b784f4fc6be40740d08075b5e8b5b817d30c590e837e4cd420ee39db4587f"));
var exportYoutubeCookies = createServerFn({ method: "POST" }).validator(object({ consent: literal(true) })).handler(createSsrRpc("95c635c2c518a34193e9ccc5e28496400ad795c19aa2397ebeb4435a5d2ee5fd"));
var YT_EXPORT_BOOKMARKLET = "javascript:void(async function(){var h=location.hostname;if(!/(^|\\.)youtube\\.com$/.test(h)&&h!=='youtu.be'){alert('Откройте youtube.com и нажмите закладку снова');return;}var lines=['# Netscape HTTP Cookie File'];document.cookie.split(';').forEach(function(p){p=p.trim();var i=p.indexOf('=');if(i<1)return;var n=p.slice(0,i),v=p.slice(i+1);lines.push('.youtube.com\\tTRUE\\t/\\tTRUE\\t0\\t'+n+'\\t'+v);});var t=lines.join('\\n')+'\\n';try{await navigator.clipboard.writeText(t);alert('Cookies скопированы. Вернитесь в Octava и вставьте в поле.');}catch(e){prompt('Скопируйте cookies:',t);}})();";
function CookiesPanel({ value, onChange, savedCount, onStatus }) {
	const [exportOpen, setExportOpen] = (0, import_react.useState)(false);
	const [agreed, setAgreed] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const fileRef = (0, import_react.useRef)(null);
	const areaRef = (0, import_react.useRef)(null);
	const empty = !value.trim() && savedCount <= 0;
	const rows = savedCount || countCookieRows(value);
	const onStatusRef = (0, import_react.useRef)(onStatus);
	onStatusRef.current = onStatus;
	(0, import_react.useEffect)(() => {
		setAgreed(loadCookieConsent());
		const stored = loadStoredCookies();
		if (stored) {
			saveStoredCookies(stored);
			onStatusRef.current(countCookieRows(loadStoredCookies() || stored));
		}
	}, []);
	async function persist(raw, source) {
		setBusy(true);
		try {
			const normalized = normalizeCookieFile(raw);
			const localCount = countCookieRows(normalized);
			saveStoredCookies(normalized);
			let count = localCount;
			try {
				count = (await saveYoutubeCookies({ data: { cookies: normalized } })).count;
			} catch {}
			onChange("");
			onStatus(count);
			toast.success(`${source}: ${cookieCountLabel(count)}`);
		} catch (err) {
			onChange(raw);
			toast.error(err instanceof Error ? err.message : "Не удалось сохранить cookies");
		} finally {
			setBusy(false);
		}
	}
	function fieldValue() {
		return areaRef.current?.value ?? value;
	}
	function onPickFile(file) {
		if (!file) return;
		file.text().then((text) => persist(text, file.name));
	}
	async function clear() {
		setBusy(true);
		try {
			clearStoredCookies();
			await clearYoutubeCookies();
			onChange("");
			onStatus(0);
			toast.message("Cookies удалены");
		} catch (err) {
			onChange("");
			onStatus(0);
			toast.message("Cookies удалены в браузере");
		} finally {
			setBusy(false);
		}
	}
	function openExport() {
		setAgreed(false);
		setExportOpen(true);
	}
	async function copyBookmarklet() {
		if (!agreed) {
			toast.message("Нужно согласие, чтобы продолжить");
			return;
		}
		saveCookieConsent(true);
		try {
			await navigator.clipboard.writeText(YT_EXPORT_BOOKMARKLET);
			toast.success("Букмарклет скопирован — откройте YouTube и вставьте в закладки");
		} catch {
			toast.error("Не удалось скопировать букмарклет");
		}
	}
	async function confirmExport() {
		if (!agreed) {
			toast.message("Нужно согласие, чтобы продолжить");
			return;
		}
		saveCookieConsent(true);
		setBusy(true);
		try {
			const status = await exportYoutubeCookies({ data: { consent: true } });
			onChange("");
			onStatus(status.count);
			setExportOpen(false);
			toast.success(`Экспорт из ${status.browser}: ${cookieCountLabel(status.count)}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Экспорт не удался");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-labelledby": "octava-cookies-label",
		"data-empty": empty ? "1" : "0",
		className: "rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					id: "octava-cookies-label",
					htmlFor: "octava-cookies",
					className: "flex items-center gap-2 text-sm font-medium",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cookie, { className: "size-4 text-accent" }), "Cookies YouTube"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: empty ? "не заданы — без них YouTube часто режет загрузку" : `${cookieCountLabel(rows)} заданы`
				})]
			}),
			empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Поле пустое. Экспорт только после вашего согласия: букмарклет на youtube.com или cookies.txt."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Значения скрыты. Вставьте новые в поле, чтобы заменить."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				id: "octava-cookies",
				name: "cookies",
				ref: areaRef,
				value,
				rows: 3,
				onChange: (e) => onChange(e.target.value),
				onPaste: () => {
					window.requestAnimationFrame(() => {
						const live = areaRef.current?.value;
						if (typeof live === "string") onChange(live);
					});
				},
				onBlur: () => {
					const live = fieldValue();
					if (live.trim() && isLikelyCookieFile(live)) persist(live, "Поле");
				},
				onDrop: (e) => {
					const file = e.dataTransfer.files?.[0];
					if (!file) return;
					e.preventDefault();
					onPickFile(file);
				},
				spellCheck: false,
				autoComplete: "off",
				autoCorrect: "off",
				placeholder: "# Netscape HTTP Cookie File — вставьте экспорт YouTube",
				className: "mt-3 min-h-16 max-h-48"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: ".txt,.json,text/plain,application/json",
				className: "sr-only",
				tabIndex: -1,
				"aria-hidden": "true",
				onChange: (e) => {
					onPickFile(e.target.files?.[0]);
					e.currentTarget.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [
					empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						id: "octava-cookies-export",
						type: "button",
						variant: "sage",
						disabled: busy,
						onClick: openExport,
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Youtube, { className: "size-4" }), "Экспорт cookies YouTube"]
					}) : null,
					value.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						id: "octava-cookies-save",
						type: "button",
						variant: "sage",
						disabled: busy,
						onClick: () => void persist(fieldValue(), "Поле"),
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), "Сохранить"]
					}) : null,
					!empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						id: "octava-cookies-clear",
						type: "button",
						variant: "secondary",
						disabled: busy,
						onClick: () => void clear(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Очистить"]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						id: "octava-cookies-file",
						type: "button",
						variant: "secondary",
						disabled: busy,
						onClick: () => fileRef.current?.click(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "size-4" }), "Файл cookies.txt"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: exportOpen,
				onOpenChange: setExportOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-dvh overflow-y-auto sm:max-w-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Экспорт cookies YouTube" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Нужно ваше согласие. Octava не читает чужие вкладки сама: после согласия вы сами переносите cookies с youtube.com в поле ниже." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
							className: "space-y-2 text-sm text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "1. Отметьте согласие." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "2. Откройте YouTube и войдите в свой аккаунт." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "3. Скопируйте букмарклет, добавьте в закладки, нажмите его на youtube.com — затем вставьте результат в поле." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-4 flex cursor-pointer items-start gap-3 rounded-md bg-raised p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
								id: "octava-cookies-consent",
								checked: agreed,
								onCheckedChange: (v) => setAgreed(v === true),
								className: "mt-0.5"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Разрешаю Octava использовать мои cookies YouTube только для скачивания аудио в этом приложении. Не передавать их третьим лицам." })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									id: "octava-open-youtube",
									type: "button",
									variant: "secondary",
									onClick: () => window.open("https://www.youtube.com/", "_blank", "noopener,noreferrer"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Youtube, { className: "size-4" }), "Открыть YouTube"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									id: "octava-copy-bookmarklet",
									type: "button",
									variant: "secondary",
									disabled: !agreed,
									onClick: () => void copyBookmarklet(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), "Скопировать букмарклет"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									id: "octava-cookies-consent-ok",
									type: "button",
									disabled: !agreed || busy,
									onClick: () => void confirmExport(),
									children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), "Согласен, взять из браузера"]
								})
							]
						})
					]
				})
			})
		]
	});
}
var MAX = 180;
var listeners = /* @__PURE__ */ new Set();
var lines = [];
var localSeq = 0;
var downloadRatio = 0;
var ignoreStaleUntil = 0;
var seenEpoch = 0;
function emit() {
	for (const fn of listeners) fn();
}
function getYtLines() {
	return lines;
}
function getYtDownloadRatio() {
	return downloadRatio;
}
function setYtDownloadRatio(n, epoch) {
	const next = n == null || !Number.isFinite(n) ? 0 : Math.max(0, Math.min(1, n));
	if (epoch != null && epoch > seenEpoch) {
		seenEpoch = epoch;
		ignoreStaleUntil = 0;
	}
	if (next >= .98 && Date.now() < ignoreStaleUntil) return;
	if (Math.abs(next - downloadRatio) < .004) return;
	downloadRatio = next;
	emit();
}
function resetYtDownloadRatio() {
	downloadRatio = 0;
	ignoreStaleUntil = Date.now() + 2500;
	emit();
}
function subscribeYtLog(fn) {
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
}
function seenRecently(text) {
	return lines.slice(-24).some((line) => line.text === text);
}
var DOWNLOAD_PCT = /\[download\]\s+(\d+(?:\.\d+)?)%/;
function ratioFromText(text) {
	const match = text.match(DOWNLOAD_PCT);
	if (match) return Math.max(0, Math.min(Number(match[1]) / 100, 1));
	if (/скачивание\s/i.test(text)) return 0;
	if (/готово\s|Destination:|ExtractAudio/i.test(text)) return Math.max(downloadRatio, .92);
	return null;
}
function noteYt(level, text) {
	const trimmed = text.replace(/\s+/g, " ").trim();
	if (!trimmed || seenRecently(trimmed)) return;
	const fromText = ratioFromText(trimmed);
	if (fromText != null) setYtDownloadRatio(fromText);
	localSeq += 1;
	lines = [...lines, {
		id: -localSeq,
		t: Date.now(),
		level,
		text: trimmed.slice(0, 500)
	}];
	if (lines.length > MAX) lines = lines.slice(-180);
	emit();
}
function mergeYtServer(incoming) {
	if (!incoming || incoming.length === 0) return;
	const seen = new Set(lines.filter((l) => l.id > 0).map((l) => l.id));
	const add = incoming.filter((l) => l.id > 0 && !seen.has(l.id) && !seenRecently(l.text));
	if (add.length === 0) return;
	for (const line of add) {
		const fromText = ratioFromText(line.text);
		if (fromText != null) downloadRatio = fromText;
	}
	lines = [...lines, ...add].sort((a, b) => a.t - b.t || a.id - b.id);
	if (lines.length > MAX) lines = lines.slice(-180);
	emit();
}
function ingestYtText(raw, level = "info") {
	if (!raw?.trim()) return;
	for (const row of raw.split(/\r?\n/)) {
		const text = row.trim();
		if (!text) continue;
		noteYt(/ERROR:|HTTP Error\s+4/i.test(text) ? "error" : /WARNING:/i.test(text) ? "warn" : level, text);
	}
}
function serverCursor() {
	let max = 0;
	for (const line of lines) if (line.id > max) max = line.id;
	return max;
}
function clearYtLogLocal() {
	lines = [];
	downloadRatio = 0;
	ignoreStaleUntil = 0;
	emit();
}
var LEVEL_LABEL = {
	info: "info",
	warn: "warn",
	error: "err",
	ok: "ok"
};
function YtConsole({ busy = false }) {
	const lines = (0, import_react.useSyncExternalStore)(subscribeYtLog, getYtLines, getYtLines);
	const [open, setOpen] = (0, import_react.useState)(false);
	const lastError = [...lines].reverse().find((l) => l.level === "error");
	const last = lines[lines.length - 1];
	const status = lastError && (!last || last.t - lastError.t < 8e3) ? lastError : last;
	useYtLogPoll(busy || open);
	(0, import_react.useEffect)(() => {
		if (lastError && Date.now() - lastError.t < 15e3) setOpen(true);
	}, [lastError?.id]);
	async function onClear() {
		clearYtLogLocal();
		try {
			await clearExtractorLog();
		} catch {}
	}
	async function onCopy() {
		const text = lines.map((l) => l.text).join("\n");
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Консоль скопирована");
		} catch {
			toast.error("Не удалось скопировать");
		}
	}
	const statusText = status?.text ?? (busy ? "yt-dlp работает…" : "yt-dlp · ожидание запроса");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "octava-console",
		className: "rounded-lg bg-surface shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-stretch gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				id: "octava-console-toggle",
				type: "button",
				"aria-expanded": open,
				"aria-controls": "octava-console-log",
				onClick: () => setOpen((v) => !v),
				className: "flex min-h-11 min-w-0 flex-1 items-center gap-2 px-4 py-2 text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { className: cn("size-4 shrink-0", status?.level === "error" ? "text-danger" : "text-accent") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						id: "octava-console-status",
						"aria-live": "polite",
						className: cn("min-w-0 flex-1 truncate font-mono text-xs", status?.level === "error" ? "text-danger" : "text-muted"),
						children: statusText
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("size-4 shrink-0 text-subtle transition-transform duration-[var(--motion-quick)]", open && "rotate-180") })
				]
			}), lines.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				size: "icon-sm",
				className: "my-1 mr-1",
				"aria-label": "Очистить консоль",
				id: "octava-console-clear",
				onClick: () => void onClear(),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
			}) : null]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-t border-line px-3 pb-3 pt-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-wide text-subtle uppercase",
					children: "Консоль yt-dlp"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "ghost",
					size: "sm",
					disabled: lines.length === 0,
					onClick: () => void onCopy(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), "Копировать"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YtLogPane, { id: "octava-console-log" })]
		}) : null]
	});
}
function YtLogPane({ id, className }) {
	const lines = (0, import_react.useSyncExternalStore)(subscribeYtLog, getYtLines, getYtLines);
	const scroller = (0, import_react.useRef)(null);
	const last = lines[lines.length - 1];
	(0, import_react.useEffect)(() => {
		const el = scroller.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [
		lines.length,
		last?.id,
		last?.text
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		id,
		ref: scroller,
		role: "log",
		className: cn("max-h-40 overflow-auto rounded-md bg-raised px-3 py-2 font-mono text-xs leading-relaxed", className),
		children: lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-subtle",
			children: "Здесь stderr yt-dlp: ошибки, предупреждения и ход загрузки."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-1",
			children: lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("w-8 shrink-0 uppercase", line.level === "error" ? "text-danger" : line.level === "ok" ? "text-accent" : line.level === "warn" ? "text-muted" : "text-subtle"),
					children: LEVEL_LABEL[line.level]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("min-w-0 whitespace-pre-wrap break-all", line.level === "error" ? "text-danger" : "text-fg"),
					children: line.text
				})]
			}, `${line.id}-${line.t}`))
		})
	});
}
function useYtLogPoll(active = false) {
	(0, import_react.useEffect)(() => {
		let alive = true;
		async function tick() {
			try {
				const next = await getExtractorLog({ data: { after: serverCursor() } });
				if (!alive) return;
				mergeYtServer(next?.lines);
				setYtDownloadRatio(next?.progress, next?.epoch);
			} catch {}
		}
		tick();
		const ms = active ? 300 : 4e3;
		const id = window.setInterval(() => void tick(), ms);
		return () => {
			alive = false;
			window.clearInterval(id);
		};
	}, [active]);
}
var blobs = /* @__PURE__ */ new Map();
var urls = /* @__PURE__ */ new Map();
function getBlob(id, format, quality = "192") {
	return blobs.get(blobKey(id, format, quality));
}
function hasBlob(id, format, quality = "192") {
	return blobs.has(blobKey(id, format, quality));
}
function setBlob(id, format, blob, quality = "192") {
	const key = blobKey(id, format, quality);
	blobs.set(key, blob);
	const prev = urls.get(key);
	if (prev) URL.revokeObjectURL(prev);
	const next = URL.createObjectURL(blob);
	urls.set(key, next);
	return next;
}
function getBlobUrl(id, format, quality = "192") {
	return urls.get(blobKey(id, format, quality));
}
var DownloadError = class extends Error {
	code;
	log;
	constructor(code, message, log = "") {
		super(message);
		this.code = code;
		this.log = log;
	}
};
async function readJson(res) {
	try {
		return await res.json();
	} catch {
		return {};
	}
}
async function startJob(input) {
	const res = await fetch("/api/job", {
		method: "POST",
		headers: { "content-type": "application/json" },
		cache: "no-store",
		body: JSON.stringify({
			videoId: input.videoId,
			title: input.title,
			format: input.format,
			quality: input.format === "mp3" ? input.quality ?? "192" : void 0,
			cookies: input.cookies?.trim() ? input.cookies : void 0
		})
	});
	const body = await readJson(res);
	if (!res.ok || !body.job) throw new DownloadError(typeof body.code === "string" ? body.code : "JOB", typeof body.message === "string" ? body.message : `Не удалось создать задание (${res.status})`);
	return body.job;
}
async function listJobs() {
	const res = await fetch("/api/job", { cache: "no-store" });
	if (!res.ok) return [];
	const body = await readJson(res);
	return Array.isArray(body.jobs) ? body.jobs : [];
}
async function getJob(jobId) {
	const res = await fetch(`/api/job?id=${encodeURIComponent(jobId)}`, { cache: "no-store" });
	const body = await readJson(res);
	if (!res.ok || !body.job) throw new DownloadError(typeof body.code === "string" ? body.code : "JOB", typeof body.message === "string" ? body.message : "Нет такого задания");
	return body.job;
}
async function cancelJob(jobId) {
	await fetch(`/api/job?id=${encodeURIComponent(jobId)}`, {
		method: "DELETE",
		cache: "no-store"
	});
}
async function fetchJobFile(job, quality = "192") {
	const res = await fetch(`/api/job?id=${encodeURIComponent(job.jobId)}&download=1`, { cache: "no-store" });
	if (!res.ok) {
		const body = await readJson(res);
		throw new DownloadError(typeof body.code === "string" ? body.code : "HTTP", typeof body.message === "string" ? body.message : `Не удалось скачать (${res.status})`);
	}
	const blob = await res.blob();
	if (blob.size < 4096) throw new DownloadError("YOUTUBE_BLOCKED", "YouTube отклонил загрузку. Обновите cookies YouTube и попробуйте снова.");
	setBlob(job.videoId, job.format, blob, job.format === "mp3" ? job.quality : quality);
	return blob;
}
function sleep(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}
		const timer = window.setTimeout(resolve, ms);
		signal?.addEventListener("abort", () => {
			window.clearTimeout(timer);
			reject(new DOMException("Aborted", "AbortError"));
		}, { once: true });
	});
}
async function waitForJob(jobId, onProgress, signal) {
	let misses = 0;
	for (;;) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
		try {
			const job = await getJob(jobId);
			misses = 0;
			onProgress?.(Math.max(.03, job.progress));
			if (job.status === "done") return job;
			if (job.status === "error") throw new DownloadError("JOB", job.error || "Не удалось скачать");
			if (job.status === "cancelled") throw new DOMException("Aborted", "AbortError");
		} catch (err) {
			if (err instanceof DownloadError || err instanceof DOMException && err.name === "AbortError") throw err;
			misses += 1;
			if (misses > 45) throw new DownloadError("NET", "Сеть пропала слишком надолго. Задание могло продолжиться на сервере — обновите страницу.");
			await sleep(Math.min(2500, 400 + misses * 120), signal);
			continue;
		}
		await sleep(400, signal);
	}
}
async function fetchAudioBlob(id, format, onProgress, cookies, quality = "192", signal, title) {
	const cached = getBlob(id, format, quality);
	if (cached && cached.size >= 4096) {
		onProgress?.(1);
		return cached;
	}
	const started = await startJob({
		videoId: id,
		title,
		format,
		quality,
		cookies
	});
	onProgress?.(Math.max(.03, started.progress));
	let finished = started;
	if (started.status !== "done") {
		const onAbort = () => {
			cancelJob(started.jobId);
		};
		signal?.addEventListener("abort", onAbort, { once: true });
		try {
			finished = await waitForJob(started.jobId, onProgress, signal);
		} finally {
			signal?.removeEventListener("abort", onAbort);
		}
	}
	const blob = await fetchJobFile(finished, quality);
	setBlob(id, format, blob, quality);
	onProgress?.(1);
	return blob;
}
async function packTracksZip(tracks, format, onProgress, quality = "192") {
	const zip = new import_lib.default();
	const skipped = [];
	let packed = 0;
	const total = tracks.length;
	for (const track of tracks) {
		onProgress?.(packed, total, track.title);
		const blob = getBlob(track.id, format, quality);
		if (!blob) {
			skipped.push(track.title);
			continue;
		}
		packed += 1;
		const ext = extensionFor(format, blob.type);
		const index = String(packed).padStart(2, "0");
		zip.file(`${index} ${safeFilename(track.title)}.${ext}`, blob);
	}
	onProgress?.(packed, total, "");
	return {
		blob: await zip.generateAsync({
			type: "blob",
			compression: "STORE"
		}),
		packed,
		skipped
	};
}
function saveBlobAnchor(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.rel = "noopener";
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	window.setTimeout(() => {
		a.remove();
		URL.revokeObjectURL(url);
	}, 2e4);
}
function saveBlob(blob, filename, opts) {
	if (opts?.picker) {
		const picker = window.showSaveFilePicker;
		if (typeof picker === "function") {
			picker({ suggestedName: filename }).then(async (handle) => {
				const writable = await handle.createWritable();
				await writable.write(blob);
				await writable.close();
			}).catch((err) => {
				if (err instanceof DOMException && err.name === "AbortError") return;
				saveBlobAnchor(blob, filename);
			});
			return;
		}
	}
	saveBlobAnchor(blob, filename);
}
var MAX_HISTORY = 80;
var useLibrary = create()(persist((set, get) => ({
	format: "m4a",
	mp3Quality: "192",
	catalog: {},
	historyIds: [],
	playlists: [],
	selectedIds: [],
	inbox: null,
	setFormat: (format) => set({ format }),
	setMp3Quality: (mp3Quality) => set({ mp3Quality }),
	setInbox: (inbox) => set({ inbox }),
	remember: (tracks) => {
		if (tracks.length === 0) return;
		const catalog = { ...get().catalog };
		for (const track of tracks) catalog[track.id] = track;
		const incoming = tracks.map((t) => t.id);
		set({
			catalog,
			historyIds: [...incoming, ...get().historyIds.filter((id) => !incoming.includes(id))].slice(0, MAX_HISTORY)
		});
	},
	toggleSelected: (id) => {
		const selectedIds = get().selectedIds;
		set({ selectedIds: selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id] });
	},
	setSelected: (ids) => set({ selectedIds: [...new Set(ids)] }),
	clearSelected: () => set({ selectedIds: [] }),
	createPlaylist: (name) => {
		const id = newId("pl");
		set({ playlists: [{
			id,
			name: name.trim() || "Без названия",
			trackIds: [],
			createdAt: Date.now()
		}, ...get().playlists] });
		return id;
	},
	renamePlaylist: (id, name) => set({ playlists: get().playlists.map((p) => p.id === id ? {
		...p,
		name: name.trim() || p.name
	} : p) }),
	deletePlaylist: (id) => set({ playlists: get().playlists.filter((p) => p.id !== id) }),
	addToPlaylist: (playlistId, trackIds) => set({ playlists: get().playlists.map((p) => {
		if (p.id !== playlistId) return p;
		const merged = [...p.trackIds];
		for (const id of trackIds) if (!merged.includes(id)) merged.push(id);
		return {
			...p,
			trackIds: merged
		};
	}) }),
	removeFromPlaylist: (playlistId, trackId) => set({ playlists: get().playlists.map((p) => p.id === playlistId ? {
		...p,
		trackIds: p.trackIds.filter((id) => id !== trackId)
	} : p) }),
	clearHistory: () => set({ historyIds: [] })
}), {
	name: "octava-library",
	skipHydration: true,
	partialize: (state) => ({
		format: state.format,
		mp3Quality: state.mp3Quality,
		catalog: state.catalog,
		historyIds: state.historyIds,
		playlists: state.playlists,
		inbox: state.inbox
	})
}));
var ZIP_IDLE = {
	open: false,
	current: "",
	done: 0,
	total: 0,
	packing: false,
	skipped: 0
};
function isAbortError(err) {
	return typeof DOMException !== "undefined" && err instanceof DOMException && err.name === "AbortError" || err instanceof Error && err.name === "AbortError";
}
function OctavaApp() {
	const [input, setInput] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [caps, setCaps] = (0, import_react.useState)(null);
	const [nowPlaying, setNowPlaying] = (0, import_react.useState)(null);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [activePlaylistId, setActivePlaylistId] = (0, import_react.useState)("inbox");
	const [newPlOpen, setNewPlOpen] = (0, import_react.useState)(false);
	const [newPlName, setNewPlName] = (0, import_react.useState)("");
	const [pendingAdd, setPendingAdd] = (0, import_react.useState)(null);
	const [zip, setZip] = (0, import_react.useState)(ZIP_IDLE);
	const zipAbort = (0, import_react.useRef)(null);
	const [progress, setProgress] = (0, import_react.useState)({});
	const [fetchingId, setFetchingId] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)({});
	const [cookies, setCookies] = (0, import_react.useState)("");
	const [cookieCount, setCookieCount] = (0, import_react.useState)(0);
	const [serverJobs, setServerJobs] = (0, import_react.useState)([]);
	const format = useLibrary((s) => s.format);
	const setFormat = useLibrary((s) => s.setFormat);
	const mp3Quality = useLibrary((s) => s.mp3Quality) ?? "192";
	const setMp3Quality = useLibrary((s) => s.setMp3Quality);
	const catalog = useLibrary((s) => s.catalog);
	const remember = useLibrary((s) => s.remember);
	const playlists = useLibrary((s) => s.playlists);
	const selectedIds = useLibrary((s) => s.selectedIds);
	const toggleSelected = useLibrary((s) => s.toggleSelected);
	const setSelected = useLibrary((s) => s.setSelected);
	const clearSelected = useLibrary((s) => s.clearSelected);
	const createPlaylist = useLibrary((s) => s.createPlaylist);
	const deletePlaylist = useLibrary((s) => s.deletePlaylist);
	const addToPlaylist = useLibrary((s) => s.addToPlaylist);
	const removeFromPlaylist = useLibrary((s) => s.removeFromPlaylist);
	const historyIds = useLibrary((s) => s.historyIds);
	const clearHistory = useLibrary((s) => s.clearHistory);
	const result = useLibrary((s) => s.inbox);
	const setInbox = useLibrary((s) => s.setInbox);
	(0, import_react.useEffect)(() => {
		useLibrary.persist.rehydrate();
	}, []);
	(0, import_react.useEffect)(() => {
		const local = countCookieRows(loadStoredCookies());
		if (local > 0) setCookieCount(local);
		getExtractorCaps().then((next) => {
			setCaps(next);
			setCookieCount((prev) => Math.max(prev, next.cookieCount, local));
		}).catch(() => setCaps({
			ytdlp: false,
			ffmpeg: false,
			python: null,
			cookies: false,
			cookieCount: 0
		}));
	}, []);
	const runningJobs = serverJobs.filter((j) => j.status === "queued" || j.status === "running");
	const jobsBusy = runningJobs.length > 0;
	(0, import_react.useEffect)(() => {
		let alive = true;
		const seenDone = /* @__PURE__ */ new Set();
		async function tick() {
			try {
				const jobs = await listJobs();
				if (!alive) return;
				setServerJobs(jobs);
				setReady((prev) => {
					const next = { ...prev };
					let changed = false;
					for (const job of jobs) {
						if (job.status !== "done") continue;
						const key = blobKey(job.videoId, job.format, job.quality);
						if (!next[key]) {
							next[key] = true;
							changed = true;
						}
						if (!seenDone.has(job.jobId) && job.progress >= 1) seenDone.add(job.jobId);
					}
					return changed ? next : prev;
				});
				setProgress((prev) => {
					const next = { ...prev };
					let changed = false;
					const live = /* @__PURE__ */ new Set();
					for (const job of jobs) if (job.status === "queued" || job.status === "running") {
						live.add(job.videoId);
						const ratio = Math.max(.03, job.progress);
						if (next[job.videoId] !== ratio) {
							next[job.videoId] = ratio;
							changed = true;
						}
					}
					for (const id of Object.keys(next)) if (!live.has(id)) {
						delete next[id];
						changed = true;
					}
					return changed ? next : prev;
				});
			} catch {}
		}
		tick();
		const ms = jobsBusy ? 400 : 4e3;
		const id = window.setInterval(() => void tick(), ms);
		return () => {
			alive = false;
			window.clearInterval(id);
		};
	}, [jobsBusy]);
	const ytRatio = (0, import_react.useSyncExternalStore)(subscribeYtLog, getYtDownloadRatio, getYtDownloadRatio);
	const inboxTracks = (0, import_react.useMemo)(() => {
		if (!result) return [];
		if (result.kind === "video") return [result.track];
		return result.tracks;
	}, [result]);
	const visibleTracks = (0, import_react.useMemo)(() => {
		if (activePlaylistId === "inbox") return inboxTracks;
		if (activePlaylistId === "history") return historyIds.map((id) => catalog[id]).filter(Boolean);
		const pl = playlists.find((p) => p.id === activePlaylistId);
		if (!pl) return [];
		return pl.trackIds.map((id) => catalog[id]).filter(Boolean);
	}, [
		activePlaylistId,
		inboxTracks,
		historyIds,
		catalog,
		playlists
	]);
	const selectedVisible = visibleTracks.filter((t) => selectedIds.includes(t.id));
	const allVisibleSelected = visibleTracks.length > 0 && selectedVisible.length === visibleTracks.length;
	const someVisibleSelected = selectedVisible.length > 0 && !allVisibleSelected;
	function toggleAllVisible() {
		if (allVisibleSelected) clearSelected();
		else setSelected(visibleTracks.map((t) => t.id));
	}
	async function onResolve(event) {
		event?.preventDefault();
		const q = input.trim();
		if (!q) return;
		setBusy(true);
		noteYt("info", `запрос: ${q}`);
		try {
			const out = await resolveMedia({ data: {
				input: q,
				cookies: cookiePayload(cookies)
			} });
			ingestYtText(out.log);
			if (!out.ok) {
				noteYt("error", out.message);
				toast.error(out.message);
				return;
			}
			const next = out.result;
			setInbox(next);
			const tracks = next.kind === "video" ? [next.track] : next.tracks;
			remember(tracks);
			setActivePlaylistId("inbox");
			clearSelected();
			if (tracks.length === 0) toast.message("Ничего не найдено");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Не удалось разобрать ссылку";
			noteYt("error", message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}
	function playTrack(track) {
		setNowPlaying(track);
		setPlaying(true);
	}
	async function downloadOne(track) {
		setFetchingId(track.id);
		resetYtDownloadRatio();
		setProgress((p) => ({
			...p,
			[track.id]: .03
		}));
		noteYt("info", `скачивание «${track.title}»`);
		try {
			const blob = await fetchAudioBlob(track.id, format, (ratio) => {
				setProgress((p) => ({
					...p,
					[track.id]: ratio
				}));
			}, cookiePayload(cookies), mp3Quality, void 0, track.title);
			setReady((r) => ({
				...r,
				[blobKey(track.id, format, mp3Quality)]: true
			}));
			const ext = extensionFor(format, blob.type);
			const filename = `${safeFilename(track.title)}.${ext}`;
			saveBlob(blob, filename);
			setProgress((p) => ({
				...p,
				[track.id]: 1
			}));
			noteYt("ok", `сохранено «${track.title}»`);
			toast.success("Файл готов — нажмите «На устройство», если браузер не скачал сам", {
				duration: 14e3,
				action: {
					label: "На устройство",
					onClick: () => saveBlob(blob, filename, { picker: true })
				}
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Ошибка загрузки";
			noteYt("error", `${track.title}: ${message}`);
			if (err instanceof DownloadError) ingestYtText(err.log, "error");
			toast.error(message);
		} finally {
			setFetchingId(null);
			window.setTimeout(() => {
				setProgress((p) => {
					if (!(track.id in p)) return p;
					const next = { ...p };
					delete next[track.id];
					return next;
				});
			}, 600);
		}
	}
	async function saveTrackToDevice(track) {
		const cached = getBlob(track.id, format, mp3Quality);
		if (cached) {
			saveBlob(cached, `${safeFilename(track.title)}.${extensionFor(format, cached.type)}`, { picker: true });
			return;
		}
		const done = serverJobs.find((j) => j.videoId === track.id && j.format === format && (format !== "mp3" || j.quality === mp3Quality) && j.status === "done");
		if (done) try {
			const file = await fetchJobFile(done, mp3Quality);
			saveBlob(file, `${safeFilename(track.title)}.${extensionFor(format, file.type)}`, { picker: true });
			return;
		} catch {}
		downloadOne(track);
	}
	function cancelActiveJob() {
		zipAbort.current?.abort();
		const active = runningJobs[0];
		if (active) cancelJob(active.jobId);
		noteYt("warn", "отмена");
	}
	async function packSelected() {
		const tracks = selectedVisible;
		if (tracks.length === 0) {
			toast.message("Отметьте хотя бы один трек");
			return;
		}
		if (zipAbort.current) return;
		const ac = new AbortController();
		zipAbort.current = ac;
		setZip({
			open: true,
			current: "",
			done: 0,
			total: tracks.length,
			packing: false,
			skipped: 0
		});
		const ok = [];
		let skipped = 0;
		let cancelled = false;
		for (let i = 0; i < tracks.length; i++) {
			if (ac.signal.aborted) {
				cancelled = true;
				break;
			}
			const track = tracks[i];
			setFetchingId(track.id);
			resetYtDownloadRatio();
			setProgress((p) => ({
				...p,
				[track.id]: .03
			}));
			setZip((z) => ({
				...z,
				current: track.title,
				packing: false
			}));
			try {
				await fetchAudioBlob(track.id, format, (ratio) => {
					setProgress((p) => ({
						...p,
						[track.id]: ratio
					}));
				}, cookiePayload(cookies), mp3Quality, ac.signal, track.title);
				setReady((r) => ({
					...r,
					[blobKey(track.id, format, mp3Quality)]: true
				}));
				ok.push(track);
			} catch (err) {
				if (ac.signal.aborted || isAbortError(err)) {
					cancelled = true;
					noteYt("warn", `остановлено на «${track.title}»`);
					break;
				}
				skipped += 1;
				const message = err instanceof Error ? err.message : "не скачался";
				noteYt("error", `${track.title}: ${message}`);
				noteYt("warn", `пропуск «${track.title}», следующий`);
				if (err instanceof DownloadError) ingestYtText(err.log, "error");
				setZip((z) => ({
					...z,
					skipped: z.skipped + 1
				}));
			} finally {
				setFetchingId(null);
				if (!cancelled) setZip((z) => ({
					...z,
					done: i + 1
				}));
				setProgress((p) => {
					const next = { ...p };
					delete next[track.id];
					return next;
				});
			}
		}
		setFetchingId(null);
		if (cancelled) {
			zipAbort.current = null;
			toast.message("Отменено");
			setZip(ZIP_IDLE);
			return;
		}
		if (ok.length === 0) {
			zipAbort.current = null;
			toast.error(skipped > 0 ? `Не удалось скачать выбранные треки (${skipped})` : "В архив не попало ни одного файла");
			setZip(ZIP_IDLE);
			return;
		}
		setZip((z) => ({
			...z,
			packing: true,
			current: "Упаковка ZIP"
		}));
		try {
			const packed = await packTracksZip(ok, format, (done, total, title) => {
				setZip((z) => ({
					...z,
					done,
					total,
					current: title || "Упаковка ZIP",
					packing: true
				}));
			}, mp3Quality);
			if (packed.packed === 0) toast.error("В архив не попало ни одного файла");
			else {
				const stamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				const name = result?.kind === "playlist" ? safeFilename(result.title) : "octava";
				saveBlob(packed.blob, `${name}-${stamp}.zip`);
				const skipN = skipped + packed.skipped.length;
				const zipName = `${name}-${stamp}.zip`;
				toast.success(skipN > 0 ? `ZIP: ${packed.packed} файл(ов), пропуск ${skipN}` : `ZIP: ${packed.packed} файл(ов)`, {
					duration: 14e3,
					action: {
						label: "На устройство",
						onClick: () => saveBlob(packed.blob, zipName, { picker: true })
					}
				});
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Не удалось собрать ZIP");
		} finally {
			zipAbort.current = null;
			setZip(ZIP_IDLE);
		}
	}
	function submitNewPlaylist() {
		const id = createPlaylist(newPlName);
		if (pendingAdd && pendingAdd.length > 0) addToPlaylist(id, pendingAdd);
		setNewPlName("");
		setNewPlOpen(false);
		setPendingAdd(null);
		toast.success("Сборка создана");
	}
	const heading = activePlaylistId === "history" ? "История" : activePlaylistId === "inbox" ? result?.kind === "playlist" ? result.title : result?.kind === "search" ? `Поиск: ${result.query}` : result?.kind === "video" ? "Ролик" : "Лента" : playlists.find((p) => p.id === activePlaylistId)?.name ?? "Сборка";
	const sub = activePlaylistId === "inbox" && result?.kind === "playlist" ? `${result.tracks.length} треков${result.channel ? ` · ${result.channel}` : ""}` : `${visibleTracks.length} записей`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-4 px-4 py-4 md:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "flex items-center gap-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/install",
						className: "inline-flex h-11 items-center rounded-md px-3 text-sm text-muted hover:bg-raised hover:text-fg",
						children: "Установка"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-36 md:flex-row md:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "order-2 flex w-full shrink-0 flex-col gap-3 md:order-1 md:w-64",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-wide text-subtle uppercase",
							children: "Сборки"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RailButton, {
							active: activePlaylistId === "inbox",
							onClick: () => setActivePlaylistId("inbox"),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4" }),
							label: "Лента",
							hint: inboxTracks.length ? String(inboxTracks.length) : void 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RailButton, {
							active: activePlaylistId === "history",
							onClick: () => setActivePlaylistId("history"),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "size-4" }),
							label: "История",
							hint: historyIds.length ? String(historyIds.length) : void 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-1" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium tracking-wide text-subtle uppercase",
								children: "Мои"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								"aria-label": "Новая сборка",
								onClick: () => {
									setPendingAdd(null);
									setNewPlOpen(true);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
							})]
						}),
						playlists.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-subtle",
							children: "Пока пусто — сложите треки в сборку."
						}) : playlists.map((pl) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "group flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RailButton, {
								className: "flex-1",
								active: activePlaylistId === pl.id,
								onClick: () => setActivePlaylistId(pl.id),
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListMusic, { className: "size-4" }),
								label: pl.name,
								hint: String(pl.trackIds.length)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								className: "opacity-70 md:opacity-0 md:group-hover:opacity-100",
								"aria-label": `Удалить ${pl.name}`,
								onClick: () => {
									deletePlaylist(pl.id);
									if (activePlaylistId === pl.id) setActivePlaylistId("inbox");
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
							})]
						}, pl.id))
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "order-1 min-w-0 flex-1 md:order-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: onResolve,
							className: "flex flex-col gap-3 sm:flex-row",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "sr-only",
									htmlFor: "octava-q",
									children: "Ссылка или поиск"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "octava-q",
									value: input,
									onChange: (e) => setInput(e.target.value),
									placeholder: "Ссылка на ролик, плейлист или просто запрос",
									autoComplete: "off",
									className: "flex-1"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "submit",
									disabled: busy,
									className: "h-12 shrink-0 sm:w-36",
									children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4" }), "Найти"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookiesPanel, {
								value: cookies,
								onChange: setCookies,
								savedCount: cookieCount,
								onStatus: (count) => {
									setCookieCount(count);
									setCaps((prev) => prev ? {
										...prev,
										cookies: count > 0,
										cookieCount: count
									} : prev);
								}
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YtConsole, { busy: busy || zip.open || Boolean(fetchingId) || jobsBusy })
						}),
						caps && !caps.ytdlp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-danger",
							children: [
								"Движок yt-dlp не найден.",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/install",
									className: "underline",
									children: "Установите Octava"
								}),
								", чтобы скачивать файлы."
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 flex flex-wrap items-end justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-3xl leading-tight tracking-tight md:text-4xl",
								children: heading
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: sub
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormatSwitch, {
										value: format,
										ffmpeg: caps?.ffmpeg !== false,
										onChange: (next) => {
											if (next === "mp3" && caps && !caps.ffmpeg) {
												toast.message("Для MP3 нужен ffmpeg — откройте «Установка»");
												return;
											}
											setFormat(next);
										},
										mp3Quality,
										onMp3Quality: setMp3Quality
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "secondary",
										size: "sm",
										disabled: selectedVisible.length === 0,
										onClick: () => {
											setPendingAdd(selectedVisible.map((t) => t.id));
											if (playlists.length === 0) {
												setNewPlOpen(true);
												return;
											}
											const first = playlists[0];
											addToPlaylist(first.id, selectedVisible.map((t) => t.id));
											toast.success(`Добавлено в «${first.name}»`);
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { className: "size-4" }), "В сборку"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "sage",
										size: "sm",
										disabled: selectedVisible.length === 0 || zip.open,
										onClick: () => void packSelected(),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "size-4" }),
											"ZIP · ",
											selectedVisible.length || 0
										]
									})
								]
							})]
						}),
						zip.open || fetchingId || jobsBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							id: "octava-job",
							className: "mt-4 rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: zip.open ? zip.packing ? "Собираем архив" : "Качаем треки" : "Качаем на сервере"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-0.5 truncate text-xs text-muted",
												children: zip.open ? zip.current || "…" : runningJobs[0]?.title || visibleTracks.find((t) => t.id === fetchingId)?.title || "…"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs text-subtle",
												children: "Можно закрыть вкладку — задание продолжит качаться."
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										id: "octava-job-cancel",
										type: "button",
										variant: "secondary",
										size: "sm",
										onClick: cancelActiveJob,
										children: "Отмена"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
									id: "octava-zip-progress",
									className: "mt-3 h-2.5",
									value: zip.open ? !zip.total ? 3 : zip.packing || !fetchingId && zip.done >= zip.total ? 100 : Math.min(99, Math.round((zip.done + (fetchingId ? Math.max(ytRatio, .03) * .95 : 0)) / zip.total * 100)) : Math.min(99, Math.round(Math.max(ytRatio, runningJobs[0]?.progress ?? .03, fetchingId ? progress[fetchingId] ?? .03 : .03) * 100))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 font-mono text-xs tabular-nums text-muted",
									children: zip.open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										zip.done,
										" / ",
										zip.total,
										zip.skipped > 0 ? ` · пропуск ${zip.skipped}` : "",
										!zip.packing && fetchingId ? ` · ${Math.round(Math.max(ytRatio, progress[fetchingId] ?? 0) * 100)}%` : ""
									] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										Math.round(Math.max(ytRatio, runningJobs[0]?.progress ?? .03, fetchingId ? progress[fetchingId] ?? .03 : .03) * 100),
										"%",
										runningJobs.length > 1 ? ` · ещё ${runningJobs.length - 1}` : ""
									] })
								})
							]
						}) : null,
						visibleTracks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-h-11 items-center gap-3 border-b border-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
									id: "octava-select-all",
									checked: allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false,
									onCheckedChange: () => toggleAllVisible(),
									"aria-label": allVisibleSelected ? "Снять все" : "Отметить все"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "octava-select-all",
									className: "flex min-h-11 min-w-0 cursor-pointer items-center text-sm text-muted",
									children: selectedVisible.length > 0 ? `Выбрано ${selectedVisible.length} из ${visibleTracks.length}` : "Отметить все"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "divide-y divide-line",
								children: visibleTracks.map((track) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackRow, {
									track,
									checked: selectedIds.includes(track.id),
									onCheck: () => toggleSelected(track.id),
									progress: fetchingId === track.id || runningJobs.some((j) => j.videoId === track.id) ? Math.max(progress[track.id] ?? .03, runningJobs.find((j) => j.videoId === track.id)?.progress ?? 0, fetchingId === track.id ? ytRatio : 0) : progress[track.id],
									saved: Boolean(ready[blobKey(track.id, format, mp3Quality)] || hasBlob(track.id, format, mp3Quality)),
									isPlaying: nowPlaying?.id === track.id && playing,
									onPlay: () => playTrack(track),
									onDownload: () => void downloadOne(track),
									onSave: () => saveTrackToDevice(track),
									onAdd: () => {
										if (playlists.length === 0) {
											setPendingAdd([track.id]);
											setNewPlOpen(true);
											return;
										}
										addToPlaylist(playlists[0].id, [track.id]);
										toast.success(`«${track.title}» в сборке`);
									},
									onRemove: activePlaylistId !== "inbox" && activePlaylistId !== "history" ? () => removeFromPlaylist(activePlaylistId, track.id) : void 0
								}, track.id))
							})]
						}),
						activePlaylistId === "history" && historyIds.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "mt-4",
							onClick: clearHistory,
							children: "Очистить историю"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-10 mb-4 text-xs text-subtle",
							children: "Скачивайте только то, на что у вас есть права. Octava — инструмент для личной архивации, не обход лицензий."
						})
					]
				})]
			}),
			nowPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerBar, {
				track: nowPlaying,
				playing,
				hasFile: Boolean(ready[blobKey(nowPlaying.id, format, mp3Quality)] || hasBlob(nowPlaying.id, format, mp3Quality)),
				format,
				quality: mp3Quality,
				onToggle: () => setPlaying((v) => !v),
				onClose: () => {
					setPlaying(false);
					setNowPlaying(null);
				}
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: newPlOpen,
				onOpenChange: setNewPlOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Новая сборка" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Локальный плейлист — хранится в этом браузере." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "flex flex-col gap-3",
					onSubmit: (e) => {
						e.preventDefault();
						submitNewPlaylist();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: newPlName,
							onChange: (e) => setNewPlName(e.target.value),
							placeholder: "Дорога, ночь, архив…",
							autoFocus: true
						}),
						playlists.length > 0 && pendingAdd ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "или добавить в существующую"
							}), playlists.map((pl) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								onClick: () => {
									addToPlaylist(pl.id, pendingAdd);
									setNewPlOpen(false);
									setPendingAdd(null);
									toast.success(`Добавлено в «${pl.name}»`);
								},
								children: pl.name
							}, pl.id))]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							children: "Создать"
						})
					]
				})] })
			})
		]
	});
}
function RailButton({ active, onClick, icon, label, hint, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: cn("flex h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm", active ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg", className),
		children: [
			icon,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 flex-1 truncate",
				children: label
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs tabular-nums text-subtle",
				children: hint
			}) : null
		]
	});
}
function FormatSwitch({ value, onChange, ffmpeg, mp3Quality, onMp3Quality }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex rounded-md bg-raised p-1 shadow-[var(--shadow-border)]",
			children: [
				"m4a",
				"mp3",
				"source"
			].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				id: `octava-format-${opt}`,
				type: "button",
				onClick: () => onChange(opt),
				disabled: opt === "mp3" && !ffmpeg,
				className: cn("h-8 rounded-sm px-2.5 text-xs font-medium", value === opt ? "bg-fg text-bg" : "text-muted hover:text-fg"),
				children: FORMAT_LABEL[opt]
			}, opt))
		}), value === "mp3" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1 rounded-md bg-raised p-1 shadow-[var(--shadow-border)]",
			role: "group",
			"aria-label": "Качество MP3, кбит/с",
			children: [MP3_QUALITIES.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				id: `octava-mp3-q-${q}`,
				type: "button",
				onClick: () => onMp3Quality(q),
				className: cn("h-8 rounded-sm px-2.5 font-mono text-xs font-medium tabular-nums", mp3Quality === q ? "bg-fg text-bg" : "text-muted hover:text-fg"),
				children: MP3_QUALITY_LABEL[q]
			}, q)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pr-2 pl-0.5 text-xs text-subtle",
				children: "кбит/с"
			})]
		}) : null]
	});
}
function EmptyState() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-16 flex flex-col items-start gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-2xl tracking-tight",
			children: "Кассета ещё пустая"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-md text-sm text-muted",
			children: "Вставьте ссылку на ролик или плейлист YouTube — или просто начните искать. Можно отметить несколько дорожек и упаковать их в ZIP."
		})]
	});
}
function TrackRow({ track, checked, onCheck, progress, saved, isPlaying, onPlay, onDownload, onSave, onAdd, onRemove }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-center gap-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
				checked,
				onCheckedChange: onCheck,
				"aria-label": `Выбрать ${track.title}`,
				className: "mt-0.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onPlay,
				className: "relative size-14 shrink-0 overflow-hidden rounded-sm bg-raised",
				"aria-label": `Слушать ${track.title}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: track.thumbnail,
					alt: "",
					referrerPolicy: "no-referrer",
					className: "size-full object-cover outline outline-1 -outline-offset-1 outline-fg/10"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute inset-0 flex items-center justify-center bg-bg/40",
					children: isPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex h-4 items-end gap-0.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "eq-bar h-4 w-0.5 bg-accent" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "eq-bar h-4 w-0.5 bg-accent" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "eq-bar h-4 w-0.5 bg-accent" })
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
						className: "size-4 text-fg",
						fill: "currentColor"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm font-medium",
						children: track.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate text-xs text-muted",
						children: [
							track.channel,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-1.5 text-subtle",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: formatDuration(track.duration)
							}),
							track.filesize ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-1.5 text-subtle",
								children: "·"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: formatBytes(track.filesize)
							})] }) : null
						]
					}),
					progress != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
						value: Math.round(progress * 100),
						className: "mt-2 h-2.5"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 font-mono text-xs tabular-nums text-muted",
						children: [Math.round(progress * 100), "%"]
					})] }) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						"aria-label": "В сборку",
						onClick: onAdd,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					}),
					onRemove ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						"aria-label": "Убрать",
						onClick: onRemove,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					}) : null,
					saved && progress == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "sage",
						size: "sm",
						"aria-label": "Сохранить на устройство",
						onClick: onSave,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "На устройство"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "icon-sm",
						"aria-label": "Скачать",
						onClick: onDownload,
						disabled: progress != null,
						children: progress != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" })
					})
				]
			})
		]
	});
}
function PlayerBar({ track, playing, hasFile, format, quality, onToggle, onClose }) {
	const audioRef = (0, import_react.useRef)(null);
	const fileUrl = hasFile ? getBlobUrl(track.id, format, quality) : void 0;
	(0, import_react.useEffect)(() => {
		const el = audioRef.current;
		if (!el) return;
		if (playing) el.play().catch(() => void 0);
		else el.pause();
	}, [playing, fileUrl]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 py-3 pr-28 md:px-8 md:pr-36",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-6xl items-center gap-3",
			children: [
				playing && !fileUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden overflow-hidden rounded-sm sm:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
						title: track.title,
						src: `https://www.youtube-nocookie.com/embed/${track.id}?autoplay=1&rel=0&modestbranding=1`,
						allow: "autoplay; encrypted-media",
						className: "h-20 w-32 border-0"
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: track.thumbnail,
					alt: "",
					referrerPolicy: "no-referrer",
					className: "size-12 rounded-sm object-cover outline outline-1 -outline-offset-1 outline-fg/10"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm font-medium",
						children: track.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-xs text-muted",
						children: track.channel
					})]
				}),
				fileUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
					ref: audioRef,
					className: "hidden",
					src: fileUrl,
					preload: "metadata"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "icon",
					"aria-label": playing ? "Пауза" : "Играть",
					onClick: onToggle,
					children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
						className: "size-4",
						fill: "currentColor"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: onClose,
					children: "Закрыть"
				})
			]
		}), playing && !fileUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
			title: "",
			src: `https://www.youtube-nocookie.com/embed/${track.id}?autoplay=1&rel=0&modestbranding=1`,
			allow: "autoplay; encrypted-media",
			className: "mt-3 h-44 w-full rounded-md border-0 sm:hidden"
		}) : null]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OctavaApp, {});
}
//#endregion
export { Home as component };
