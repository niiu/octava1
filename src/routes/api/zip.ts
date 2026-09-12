import { createFileRoute } from "@tanstack/react-router";
import { getZipPack, startZipPack, streamJobsZip, streamPackedZip } from "@/lib/jobs.server";
import { safeFilename } from "@/lib/media";
import { instanceFromRequest } from "@/lib/instance.server";

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
        const file = url.searchParams.get("file")?.trim();
        if (file) return streamPackedZip(file);
        const packId = url.searchParams.get("pack")?.trim();
        if (packId) {
          const pack = await getZipPack(packId);
          if (!pack) {
            return Response.json({ code: "NOT_FOUND", message: "Нет такой сборки архива" }, { status: 404 });
          }
          return Response.json({ pack });
        }
        const ids = parseIds(url.searchParams.get("ids"));
        if (ids.length === 0) {
          return Response.json({ code: "BAD_ID", message: "Нет id заданий" }, { status: 400 });
        }
        const rawName = url.searchParams.get("name")?.trim() || "octava";
        return streamJobsZip(ids, `${safeFilename(rawName)}.zip`, instanceFromRequest(request));
      },
      POST: async ({ request }) => {
        let body: { ids?: unknown; name?: unknown; instance?: unknown } = {};
        try {
          body = (await request.json()) as { ids?: unknown; name?: unknown; instance?: unknown };
        } catch {
          return Response.json({ code: "BAD_ID", message: "Некорректный запрос ZIP" }, { status: 400 });
        }
        const ids = parseIds(body.ids);
        if (ids.length === 0) {
          return Response.json({ code: "BAD_ID", message: "Нет id заданий" }, { status: 400 });
        }
        const rawName = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "octava";
        const pack = await startZipPack(ids, `${safeFilename(rawName)}.zip`, instanceFromRequest(request, body.instance));
        if (pack instanceof Response) return pack;
        return Response.json({ pack, zip: pack.zip });
      },
    },
  },
});
