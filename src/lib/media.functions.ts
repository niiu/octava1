import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ExtractorError, getCaps, resolveInput } from "./extractor.server";
import {
  clearCookieFile,
  exportFromBrowser,
  saveCookieFile,
} from "./cookie-store.server";
import { clearLog, dumpLogText, getLogBoot, getProgressEpoch, listLog, progressForInstance } from "./yt-log.server";
import { normalizeInstanceId, runWithInstance } from "./instance.server";

const inputSchema = z.object({
  input: z.string().trim().min(1, "Вставьте ссылку или поисковый запрос").max(500),
  cookies: z.string().max(200_000).optional(),
  instance: z.string().max(48).optional(),
});

const instanceSchema = z.object({
  instance: z.string().max(48).optional(),
});

export const getExtractorCaps = createServerFn({ method: "GET" }).handler(
  async () => getCaps(),
);

export const getExtractorLog = createServerFn({ method: "POST" })
  .validator(
    z.object({
      after: z.coerce.number().int().nonnegative().optional(),
      instance: z.string().max(48).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const instanceId = normalizeInstanceId(data.instance);
    return {
      lines: listLog(data.after ?? 0, instanceId),
      progress: progressForInstance(instanceId),
      epoch: getProgressEpoch(),
      boot: getLogBoot(),
    };
  });

export const clearExtractorLog = createServerFn({ method: "POST" })
  .validator(instanceSchema)
  .handler(async ({ data }) => {
    clearLog(normalizeInstanceId(data.instance));
    return { ok: true as const };
  });

export const resolveMedia = createServerFn({ method: "POST" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    const instanceId = normalizeInstanceId(data.instance);
    return runWithInstance(instanceId, async () => {
      try {
        const result = await resolveInput(data.input, data.cookies);
        return { ok: true as const, result, log: dumpLogText(24, instanceId) };
      } catch (err) {
        if (err instanceof ExtractorError) {
          return {
            ok: false as const,
            message: err.message,
            code: err.code,
            log: err.log || dumpLogText(40, instanceId),
          };
        }
        return {
          ok: false as const,
          message: err instanceof Error ? err.message : "Не удалось разобрать ссылку.",
          code: "EXTRACT",
          log: dumpLogText(40, instanceId),
        };
      }
    });
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
