import { setBlob } from "./blobs";
import type { AudioFormat, DownloadJob, Mp3Quality } from "./media";
import { DEFAULT_MP3_QUALITY } from "./media";

export class DownloadError extends Error {
  code: string;
  log: string;
  constructor(code: string, message: string, log = "") {
    super(message);
    this.code = code;
    this.log = log;
  }
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function startJob(input: {
  videoId: string;
  title?: string;
  format: AudioFormat;
  quality?: Mp3Quality;
  cookies?: string;
}): Promise<DownloadJob> {
  const res = await fetch("/api/job", {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      videoId: input.videoId,
      title: input.title,
      format: input.format,
      quality: input.format === "mp3" ? input.quality ?? DEFAULT_MP3_QUALITY : undefined,
      cookies: input.cookies?.trim() ? input.cookies : undefined,
    }),
  });
  const body = await readJson(res);
  if (!res.ok || !body.job) {
    throw new DownloadError(
      typeof body.code === "string" ? body.code : "JOB",
      typeof body.message === "string" ? body.message : `Не удалось создать задание (${res.status})`,
    );
  }
  return body.job as DownloadJob;
}

export async function listJobs(): Promise<DownloadJob[]> {
  const res = await fetch("/api/job", { cache: "no-store" });
  if (!res.ok) return [];
  const body = await readJson(res);
  return Array.isArray(body.jobs) ? (body.jobs as DownloadJob[]) : [];
}

export async function getJob(jobId: string): Promise<DownloadJob> {
  const res = await fetch(`/api/job?id=${encodeURIComponent(jobId)}`, { cache: "no-store" });
  const body = await readJson(res);
  if (!res.ok || !body.job) {
    throw new DownloadError(
      typeof body.code === "string" ? body.code : "JOB",
      typeof body.message === "string" ? body.message : "Нет такого задания",
    );
  }
  return body.job as DownloadJob;
}

export async function cancelJob(jobId: string): Promise<void> {
  await fetch(`/api/job?id=${encodeURIComponent(jobId)}`, { method: "DELETE", cache: "no-store" });
}

export function jobDownloadUrl(jobId: string): string {
  return `/api/job?id=${encodeURIComponent(jobId)}&download=1`;
}

export function zipDownloadUrl(jobIds: string[], name = "octava"): string {
  const ids = jobIds.filter(Boolean).join(",");
  return `/api/zip?ids=${encodeURIComponent(ids)}&name=${encodeURIComponent(name)}`;
}

export function startBrowserDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => a.remove(), 8_000);
}

export async function fetchJobFile(
  job: DownloadJob,
  quality: Mp3Quality = DEFAULT_MP3_QUALITY,
): Promise<Blob> {
  const res = await fetch(`/api/job?id=${encodeURIComponent(job.jobId)}&download=1`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await readJson(res);
    throw new DownloadError(
      typeof body.code === "string" ? body.code : "HTTP",
      typeof body.message === "string" ? body.message : `Не удалось скачать (${res.status})`,
    );
  }
  const blob = await res.blob();
  if (blob.size < 4_096) {
    throw new DownloadError(
      "YOUTUBE_BLOCKED",
      "YouTube отклонил загрузку. Обновите cookies YouTube и попробуйте снова.",
    );
  }
  setBlob(job.videoId, job.format, blob, job.format === "mp3" ? job.quality : quality);
  return blob;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export async function waitForJob(
  jobId: string,
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<DownloadJob> {
  let misses = 0;
  for (;;) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const job = await getJob(jobId);
      misses = 0;
      onProgress?.(Math.max(0.03, job.progress));
      if (job.status === "done") return job;
      if (job.status === "error") {
        throw new DownloadError("JOB", job.error || "Не удалось скачать");
      }
      if (job.status === "cancelled") {
        throw new DOMException("Aborted", "AbortError");
      }
    } catch (err) {
      if (err instanceof DownloadError || (err instanceof DOMException && err.name === "AbortError")) {
        throw err;
      }
      misses += 1;
      if (misses > 45) {
        throw new DownloadError(
          "NET",
          "Сеть пропала слишком надолго. Задание могло продолжиться на сервере — обновите страницу.",
        );
      }
      await sleep(Math.min(2_500, 400 + misses * 120), signal);
      continue;
    }
    await sleep(400, signal);
  }
}
