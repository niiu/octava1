import { createFileRoute } from "@tanstack/react-router";
import {
  errorResponse,
  extractAudio,
  streamAudioFile,
} from "@/lib/extractor.server";
import type { AudioFormat } from "@/lib/media";

const FORMATS = new Set<AudioFormat>(["m4a", "mp3", "source"]);

export const Route = createFileRoute("/api/audio")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id") ?? "";
        const formatRaw = url.searchParams.get("format") ?? "m4a";
        const format = FORMATS.has(formatRaw as AudioFormat)
          ? (formatRaw as AudioFormat)
          : "m4a";
        try {
          const file = await extractAudio(id, format);
          return await streamAudioFile(file);
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
