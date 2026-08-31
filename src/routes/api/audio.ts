import { createFileRoute } from "@tanstack/react-router";
import {
  errorResponse,
  extractAudio,
  streamAudioFile,
} from "@/lib/extractor.server";
import type { AudioFormat, Mp3Quality } from "@/lib/media";
import { parseMp3Quality } from "@/lib/media";

const FORMATS = new Set<AudioFormat>(["m4a", "mp3", "source"]);

function parseFormat(raw: string | null | undefined): AudioFormat {
  const formatRaw = raw ?? "m4a";
  return FORMATS.has(formatRaw as AudioFormat) ? (formatRaw as AudioFormat) : "m4a";
}

async function handleAudio(
  id: string,
  format: AudioFormat,
  cookies?: string,
  quality?: Mp3Quality,
) {
  const file = await extractAudio(id, format, cookies, quality);
  return streamAudioFile(file);
}

export const Route = createFileRoute("/api/audio")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id") ?? "";
        const format = parseFormat(url.searchParams.get("format"));
        const quality = parseMp3Quality(url.searchParams.get("quality"));
        try {
          return await handleAudio(id, format, undefined, quality);
        } catch (err) {
          return errorResponse(err);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            id?: unknown;
            format?: unknown;
            cookies?: unknown;
            quality?: unknown;
          };
          const id = typeof body.id === "string" ? body.id : "";
          const format = parseFormat(typeof body.format === "string" ? body.format : "m4a");
          const cookies = typeof body.cookies === "string" ? body.cookies : undefined;
          const quality = parseMp3Quality(body.quality);
          return await handleAudio(id, format, cookies, quality);
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
