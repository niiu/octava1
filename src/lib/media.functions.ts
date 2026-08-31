import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ExtractorError, getCaps, resolveInput } from "./extractor.server";

const inputSchema = z.object({
  input: z.string().trim().min(1, "Вставьте ссылку или запрос").max(500),
});

export const getExtractorCaps = createServerFn({ method: "GET" }).handler(
  async () => getCaps(),
);

export const resolveMedia = createServerFn({ method: "POST" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    try {
      return await resolveInput(data.input);
    } catch (err) {
      if (err instanceof ExtractorError) {
        throw new Error(err.message);
      }
      throw err;
    }
  });
