import { createFileRoute } from "@tanstack/react-router";
import { streamJobsZip } from "@/lib/jobs.server";
import { safeFilename } from "@/lib/media";

function parseIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((id) => String(id).trim()).filter(Boolean).slice(0, 40);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 40);
  }
  return [];
}

export const Route = createFileRoute("/api/zip")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const ids = parseIds(url.searchParams.get("ids"));
        if (ids.length === 0) {
          return Response.json({ code: "BAD_ID", message: "Нет id заданий" }, { status: 400 });
        }
        const rawName = url.searchParams.get("name")?.trim() || "octava";
        return streamJobsZip(ids, `${safeFilename(rawName)}.zip`);
      },
      POST: async ({ request }) => {
        let body: { ids?: unknown; name?: unknown } = {};
        try {
          body = (await request.json()) as { ids?: unknown; name?: unknown };
        } catch {
          return Response.json({ code: "BAD_ID", message: "Некорректный запрос ZIP" }, { status: 400 });
        }
        const ids = parseIds(body.ids);
        if (ids.length === 0) {
          return Response.json({ code: "BAD_ID", message: "Нет id заданий" }, { status: 400 });
        }
        const rawName = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "octava";
        return streamJobsZip(ids, `${safeFilename(rawName)}.zip`);
      },
    },
  },
});
