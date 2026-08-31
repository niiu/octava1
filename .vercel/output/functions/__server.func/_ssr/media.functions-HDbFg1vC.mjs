import { _ as resolveInput, c as exportFromBrowser, i as clearCookieFile, p as getCaps, t as ExtractorError, y as saveCookieFile } from "./extractor.server-BcKYwDyz.mjs";
import { i as string, r as object, t as literal } from "../_libs/zod.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/media.functions-HDbFg1vC.js
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
var resolveMedia_createServerFn_handler = createServerRpc({
	id: "7e356af630bd8842a70e21ae4d5acf69fbaf908febfd6b21f4ee151cf81033db",
	name: "resolveMedia",
	filename: "src/lib/media.functions.ts"
}, (opts) => resolveMedia.__executeServer(opts));
var resolveMedia = createServerFn({ method: "POST" }).validator(inputSchema).handler(resolveMedia_createServerFn_handler, async ({ data }) => {
	try {
		return await resolveInput(data.input, data.cookies);
	} catch (err) {
		if (err instanceof ExtractorError) throw new Error(err.message);
		throw err;
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
export { clearYoutubeCookies_createServerFn_handler, exportYoutubeCookies_createServerFn_handler, getExtractorCaps_createServerFn_handler, resolveMedia_createServerFn_handler, saveYoutubeCookies_createServerFn_handler };
