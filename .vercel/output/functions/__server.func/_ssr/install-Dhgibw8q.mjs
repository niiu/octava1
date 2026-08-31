import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { m as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { f as Download, m as Check, p as Copy } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Wordmark, t as Button } from "./logo-DkvbWRMp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/install-Dhgibw8q.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FALLBACK_SCRIPT = `#!/usr/bin/env bash
set -euo pipefail
echo "Скачайте install.sh из приложения Octava."
`;
function InstallPage() {
	const [script, setScript] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		fetch("/install.sh").then((r) => r.ok ? r.text() : FALLBACK_SCRIPT).then(setScript).catch(() => setScript(FALLBACK_SCRIPT));
	}, []);
	async function copyScript() {
		try {
			await navigator.clipboard.writeText(script);
			setCopied(true);
			toast.success("Скрипт скопирован");
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			toast.error("Не удалось скопировать");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between gap-4 px-4 py-4 md:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "inline-flex h-11 items-center rounded-md px-3 text-sm text-muted hover:bg-raised hover:text-fg",
				children: "К загрузчику"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-16 md:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-wide text-subtle uppercase",
						children: "Самостоятельный хост"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl leading-tight tracking-tight",
						children: "Автоустановка"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-xl text-muted",
						children: "YouTube часто режет загрузки с облачных IP. Скрипт ставит yt-dlp, проверяет ffmpeg и поднимает Octava у вас на машине — там скачивание и ZIP обычно работают."
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "space-y-4 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: "1. Скачайте проект и скрипт"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-muted",
								children: [
									"Положите ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-fg",
										children: "install.sh"
									}),
									" в корень Octava и сделайте его исполняемым."
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: "2. Запустите один раз"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
									className: "mt-2 overflow-x-auto rounded-md bg-raised px-3 py-2 font-mono text-xs",
									children: "bash install.sh"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-muted",
									children: [
										"Скрипт поставит зависимости Node, скачает yt-dlp в",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-fg",
											children: "bin/"
										}),
										", проверит ffmpeg и запустит веб-морду."
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: "3. Cookies — если YouTube просит войти"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-muted",
								children: "Экспортируйте cookies.txt из браузера и положите в корень проекта. Octava подхватит файл автоматически."
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "/install.sh",
							download: "install.sh",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Скачать install.sh"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						onClick: () => void copyScript(),
						children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), "Копировать"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "max-h-96 overflow-auto rounded-lg bg-raised p-4 font-mono text-xs leading-relaxed text-fg shadow-[var(--shadow-border)]",
					children: script || "Загружаем скрипт…"
				})
			]
		})]
	});
}
//#endregion
export { InstallPage as component };
