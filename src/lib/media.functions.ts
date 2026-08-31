import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ExtractorError, getCaps, resolveInput } from "./extractor.server";
import {
  clearCookieFile,
  exportFromBrowser,
  saveCookieFile,
} from "./cookie-store.server";

const inputSchema = z.object({
  input: z.string().trim().min(1, "Вставьте ссылку или запрос").max(500),
  cookies: z.string().max(200_000).optional(),
});

export const getExtractorCaps = createServerFn({ method: "GET" }).handler(
  async () => getCaps(),
);

export const resolveMedia = createServerFn({ method: "POST" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    try {
      return await resolveInput(data.input, data.cookies);
    } catch (err) {
      if (err instanceof ExtractorError) {
        throw new Error(err.message);
      }
      throw err;
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
