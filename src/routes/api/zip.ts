import { createFileRoute } from "@tanstack/react-router";
import { streamJobsZip } from "@/lib/jobs.server";
import { safeFilename } from "@/lib/media";

export const Route = createFileRoute("/api/zip")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const ids = (url.searchParams.get("ids") ?? "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, 40);
        if (ids.length === 0) {
          return Response.json({ code: "BAD_ID", message: "Нет id заданий" }, { status: 400 });
        }
        const rawName = url.searchParams.get("name")?.trim() || "octava";
        return streamJobsZip(ids, `${safeFilename(rawName)}.zip`);
      },
    },
  },
});
