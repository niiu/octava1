import { S as saveCookieFile, _ as listLog, a as clearLog, b as resolveInput, c as dumpLogText, h as getCaps, i as clearCookieFile, t as ExtractorError, u as exportFromBrowser } from "./extractor.server-CxZG7wTz.mjs";
import { a as string, i as object, n as literal, t as number } from "../_libs/zod.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/media.functions-Dn-a2XQA.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var inputSchema = object({
	input: string().trim().min(1, "Вставьте ссылку или запрос").max(500),
	cookies: string().max(2e5).optional()
});
var getExtractorCaps_createServerFn_handler = createServerRpc({
	id: "76b99b627836fa9ae6745eafd568542168a86d786d5abd33801d69699fa5d02a",
	name: "getExtractorCaps",
	filename: "src/lib/media.functions.ts"
}, (opts) => getExtractorCaps.__executeServer(opts));
var getExtractorCaps = createServerFn({ method: "GET" }).handler(getExtractorCaps_createServerFn_handler, async () => getCaps());
var getExtractorLog_createServerFn_handler = createServerRpc({
	id: "471041d278f466bbbcd911e755bffb17b696a719a103b0c38afabd3b26143b21",
	name: "getExtractorLog",
	filename: "src/lib/media.functions.ts"
}, (opts) => getExtractorLog.__executeServer(opts));
var getExtractorLog = createServerFn({ method: "GET" }).validator(object({ after: number().int().nonnegative().optional() })).handler(getExtractorLog_createServerFn_handler, async ({ data }) => listLog(data.after ?? 0));
var clearExtractorLog_createServerFn_handler = createServerRpc({
	id: "fa1365f86a87bf5ba813312150f394883694e110e7e93bd7ed294ffe3257599f",
	name: "clearExtractorLog",
	filename: "src/lib/media.functions.ts"
}, (opts) => clearExtractorLog.__executeServer(opts));
var clearExtractorLog = createServerFn({ method: "POST" }).handler(clearExtractorLog_createServerFn_handler, async () => {
	clearLog();
	return { ok: true };
});
var resolveMedia_createServerFn_handler = createServerRpc({
	id: "7e356af630bd8842a70e21ae4d5acf69fbaf908febfd6b21f4ee151cf81033db",
	name: "resolveMedia",
	filename: "src/lib/media.functions.ts"
}, (opts) => resolveMedia.__executeServer(opts));
var resolveMedia = createServerFn({ method: "POST" }).validator(inputSchema).handler(resolveMedia_createServerFn_handler, async ({ data }) => {
	try {
		return {
			ok: true,
			result: await resolveInput(data.input, data.cookies),
			log: dumpLogText(24)
		};
	} catch (err) {
		if (err instanceof ExtractorError) return {
			ok: false,
			message: err.message,
			code: err.code,
			log: err.log || dumpLogText(40)
		};
		return {
			ok: false,
			message: err instanceof Error ? err.message : "Не удалось разобрать ссылку.",
			code: "EXTRACT",
			log: dumpLogText(40)
		};
	}
});
var saveYoutubeCookies_createServerFn_handler = createServerRpc({
	id: "6e5565706d3911bd6e2e3cfd69c38da374a83ee36be0a91b2ad7e105e7eb0184",
	name: "saveYoutubeCookies",
	filename: "src/lib/media.functions.ts"
}, (opts) => saveYoutubeCookies.__executeServer(opts));
var saveYoutubeCookies = createServerFn({ method: "POST" }).validator(object({ cookies: string().min(8).max(2e5) })).handler(saveYoutubeCookies_createServerFn_handler, async ({ data }) => saveCookieFile(data.cookies));
var clearYoutubeCookies_createServerFn_handler = createServerRpc({
	id: "a21b784f4fc6be40740d08075b5e8b5b817d30c590e837e4cd420ee39db4587f",
	name: "clearYoutubeCookies",
	filename: "src/lib/media.functions.ts"
}, (opts) => clearYoutubeCookies.__executeServer(opts));
var clearYoutubeCookies = createServerFn({ method: "POST" }).handler(clearYoutubeCookies_createServerFn_handler, async () => clearCookieFile());
var exportYoutubeCookies_createServerFn_handler = createServerRpc({
	id: "95c635c2c518a34193e9ccc5e28496400ad795c19aa2397ebeb4435a5d2ee5fd",
	name: "exportYoutubeCookies",
	filename: "src/lib/media.functions.ts"
}, (opts) => exportYoutubeCookies.__executeServer(opts));
var exportYoutubeCookies = createServerFn({ method: "POST" }).validator(object({ consent: literal(true) })).handler(exportYoutubeCookies_createServerFn_handler, async () => exportFromBrowser());
//#endregion
export { clearExtractorLog_createServerFn_handler, clearYoutubeCookies_createServerFn_handler, exportYoutubeCookies_createServerFn_handler, getExtractorCaps_createServerFn_handler, getExtractorLog_createServerFn_handler, resolveMedia_createServerFn_handler, saveYoutubeCookies_createServerFn_handler };
