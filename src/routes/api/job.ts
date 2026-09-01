import { createFileRoute } from "@tanstack/react-router";
import {
  cancelJob,
  getJob,
  listJobs,
  startJob,
  streamJobFile,
} from "@/lib/jobs.server";
import type { AudioFormat } from "@/lib/media";
import { parseMp3Quality } from "@/lib/media";

const FORMATS = new Set<AudioFormat>(["m4a", "mp3", "source"]);

function parseFormat(raw: unknown): AudioFormat {
  const value = typeof raw === "string" ? raw : "m4a";
  return FORMATS.has(value as AudioFormat) ? (value as AudioFormat) : "m4a";
}

export const Route = createFileRoute("/api/job")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id") ?? "";
        if (url.searchParams.get("download") && id) {
          return streamJobFile(id);
        }
        if (id) {
          const job = await getJob(id);
          if (!job) {
            return Response.json({ code: "NOT_FOUND", message: "Нет такого задания" }, { status: 404 });
          }
          return Response.json({ job });
        }
        return Response.json({ jobs: await listJobs() });
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            id?: unknown;
            videoId?: unknown;
            title?: unknown;
            format?: unknown;
            quality?: unknown;
            cookies?: unknown;
          };
          const videoId =
            typeof body.videoId === "string"
              ? body.videoId
              : typeof body.id === "string"
                ? body.id
                : "";
          if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
            return Response.json(
              { code: "BAD_ID", message: "Некорректный идентификатор ролика." },
              { status: 400 },
            );
          }
          const job = await startJob({
            videoId,
            title: typeof body.title === "string" ? body.title : videoId,
            format: parseFormat(body.format),
            quality: parseMp3Quality(body.quality),
            cookies: typeof body.cookies === "string" ? body.cookies : undefined,
          });
          return Response.json({ job });
        } catch (err) {
          return Response.json(
            {
              code: "JOB",
              message: err instanceof Error ? err.message : "Не удалось создать задание",
            },
            { status: 500 },
          );
        }
      },
      DELETE: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id") ?? "";
        if (!id) {
          return Response.json({ code: "BAD_ID", message: "Нет id задания" }, { status: 400 });
        }
        const job = await cancelJob(id);
        if (!job) {
          return Response.json({ code: "NOT_FOUND", message: "Нет такого задания" }, { status: 404 });
        }
        return Response.json({ job });
      },
    },
  },
});
