import { d as resolveInput, l as getCaps, t as ExtractorError } from "./extractor.server-BK2nXqml.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/media.functions-bVfZf3dl.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var inputSchema = object({ input: string().trim().min(1, "Вставьте ссылку или запрос").max(500) });
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
		return await resolveInput(data.input);
	} catch (err) {
		if (err instanceof ExtractorError) throw new Error(err.message);
		throw err;
	}
});
//#endregion
export { getExtractorCaps_createServerFn_handler, resolveMedia_createServerFn_handler };
