import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ExtractorError, getCaps, resolveInput } from "./extractor.server";
import {
  clearCookieFile,
  exportFromBrowser,
  saveCookieFile,
} from "./cookie-store.server";
import { clearLog, dumpLogText, getDownloadProgress, listLog } from "./yt-log.server";

const inputSchema = z.object({
  input: z.string().trim().min(1, "Вставьте ссылку или запрос").max(500),
  cookies: z.string().max(200_000).optional(),
});

export const getExtractorCaps = createServerFn({ method: "GET" }).handler(
  async () => getCaps(),
);

export const getExtractorLog = createServerFn({ method: "GET" })
  .validator(z.object({ after: z.coerce.number().int().nonnegative().optional() }))
  .handler(async ({ data }) => ({
    lines: listLog(data.after ?? 0),
    progress: getDownloadProgress(),
  }));

export const clearExtractorLog = createServerFn({ method: "POST" }).handler(
  async () => {
    clearLog();
    return { ok: true as const };
  },
);

export const resolveMedia = createServerFn({ method: "POST" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    try {
      const result = await resolveInput(data.input, data.cookies);
      return { ok: true as const, result, log: dumpLogText(24) };
    } catch (err) {
      if (err instanceof ExtractorError) {
        return {
          ok: false as const,
          message: err.message,
          code: err.code,
          log: err.log || dumpLogText(40),
        };
      }
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : "Не удалось разобрать ссылку.",
        code: "EXTRACT",
        log: dumpLogText(40),
      };
    }
  });

export const saveYoutubeCookies = createServerFn({ method: "POST" })
  .validator(
    z.object({
      cookies: z.string().min(8).max(200_000),
    }),
  )
  .handler(async ({ data }) => saveCookieFile(data.cookies));

export const clearYoutubeCookies = createServerFn({ method: "POST" }).handler(
  async () => clearCookieFile(),
);

export const exportYoutubeCookies = createServerFn({ method: "POST" })
  .validator(z.object({ consent: z.literal(true) }))
  .handler(async () => exportFromBrowser());
