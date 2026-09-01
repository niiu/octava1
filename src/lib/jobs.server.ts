import { existsSync, mkdirSync } from "node:fs";
import { copyFile, readFile, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";
import {
  ExtractorError,
  extractAudio,
  streamSavedFile,
} from "./extractor.server";
import type { AudioFormat, DownloadJob, JobStatus, Mp3Quality } from "./media";
import { contentDisposition, DEFAULT_MP3_QUALITY, extensionFor, mimeFor, newId, safeFilename } from "./media";
import { dumpLogText, getDownloadProgress } from "./yt-log.server";

type JobInternal = DownloadJob & { filePath?: string };

const jobs = new Map<string, JobInternal>();
const cookiesByJob = new Map<string, string | undefined>();
const controllers = new Map<string, AbortController>();
let loaded = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let jobsDir = "";

const MAX_JOBS = 40;

function publicJob(job: JobInternal): DownloadJob {
  return {
    jobId: job.jobId,
    videoId: job.videoId,
    title: job.title,
    format: job.format,
    quality: job.quality,
    status: job.status,
    progress: job.progress,
    error: job.error,
    filename: job.filename,
    mime: job.mime,
    bytes: job.bytes,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

function resolveDir(): string {
  const preferred = process.env.OCTAVA_DATA || path.join(process.cwd(), "data", "jobs");
  try {
    mkdirSync(preferred, { recursive: true });
    return preferred;
  } catch {
    const fallback = path.join(os.tmpdir(), "octava-jobs");
    mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

function indexPath(): string {
  return path.join(jobsDir, "index.json");
}

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  loaded = true;
  jobsDir = resolveDir();
  try {
    const raw = await readFile(indexPath(), "utf8");
    const parsed = JSON.parse(raw) as { jobs?: JobInternal[] };
    for (const job of parsed.jobs ?? []) {
      if (!job?.jobId) continue;
      if (job.status === "queued" || job.status === "running") {
        if (job.filePath && existsSync(job.filePath)) {
          const info = await stat(job.filePath).catch(() => null);
          if (info && info.size >= 4_096) {
            job.status = "done";
            job.progress = 1;
            job.bytes = info.size;
          } else {
            job.status = "error";
            job.error = "прервано при перезапуске службы — нажмите скачать снова";
          }
        } else {
          job.status = "error";
          job.error = "прервано при перезапуске службы — нажмите скачать снова";
        }
        job.updatedAt = Date.now();
      }
      jobs.set(job.jobId, job);
    }
  } catch {
    /* first run */
  }
}

function schedulePersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const payload = JSON.stringify({ jobs: [...jobs.values()] });
    void writeFile(indexPath(), payload, "utf8").catch(() => undefined);
  }, 250);
}

function patch(jobId: string, partial: Partial<JobInternal>): JobInternal | null {
  const job = jobs.get(jobId);
  if (!job) return null;
  Object.assign(job, partial, { updatedAt: Date.now() });
  schedulePersist();
  return job;
}

function reuseKey(videoId: string, format: AudioFormat, quality: Mp3Quality): string {
  return `${videoId}::${format}::${quality}`;
}

function findReusable(
  videoId: string,
  format: AudioFormat,
  quality: Mp3Quality,
): JobInternal | undefined {
  const key = reuseKey(videoId, format, quality);
  let best: JobInternal | undefined;
  for (const job of jobs.values()) {
    if (reuseKey(job.videoId, job.format, job.quality) !== key) continue;
    if (job.status === "running" || job.status === "queued") return job;
    if (job.status === "done" && job.filePath && existsSync(job.filePath)) best = job;
  }
  return best;
}

async function prune(): Promise<void> {
  if (jobs.size <= MAX_JOBS) return;
  const idle = [...jobs.values()]
    .filter((j) => j.status === "done" || j.status === "error" || j.status === "cancelled")
    .sort((a, b) => a.updatedAt - b.updatedAt);
  while (jobs.size > MAX_JOBS && idle.length > 0) {
    const old = idle.shift();
    if (!old) break;
    if (old.filePath) await unlink(old.filePath).catch(() => undefined);
    jobs.delete(old.jobId);
  }
  schedulePersist();
}

async function runJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;
  const ac = controllers.get(jobId);
  patch(jobId, { status: "running", progress: 0.03 });
  const tick = setInterval(() => {
    const current = jobs.get(jobId);
    if (!current || current.status !== "running") return;
    patch(jobId, { progress: Math.max(current.progress, getDownloadProgress() || 0.03) });
  }, 400);
  try {
    const file = await extractAudio(
      job.videoId,
      job.format,
      cookiesByJob.get(jobId),
      job.quality,
      ac?.signal,
    );
    const ext = path.extname(file.path) || `.${extensionFor(job.format, file.mime)}`;
    const dest = path.join(jobsDir, `${job.jobId}${ext}`);
    await copyFile(file.path, dest);
    const info = await stat(dest);
    await file.cleanup().catch(() => undefined);
    const filename = `${safeFilename(job.title)}.${ext.replace(/^\./, "")}`;
    patch(jobId, {
      status: "done",
      progress: 1,
      filePath: dest,
      filename,
      mime: file.mime || mimeFor(job.format),
      bytes: info.size,
    });
  } catch (err) {
    if (ac?.signal.aborted) {
      patch(jobId, { status: "cancelled", error: "отменено", progress: 0 });
      return;
    }
    const mapped = err instanceof ExtractorError ? err : null;
    patch(jobId, {
      status: "error",
      error: mapped?.message || (err instanceof Error ? err.message : "не скачался"),
    });
    if (mapped?.log) {
      /* already in extractor log */
    }
  } finally {
    clearInterval(tick);
    cookiesByJob.delete(jobId);
    controllers.delete(jobId);
    await prune();
  }
}

export async function listJobs(): Promise<DownloadJob[]> {
  await ensureLoaded();
  return [...jobs.values()]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(publicJob);
}

export async function getJob(jobId: string): Promise<DownloadJob | null> {
  await ensureLoaded();
  const job = jobs.get(jobId);
  return job ? publicJob(job) : null;
}

export async function startJob(input: {
  videoId: string;
  title?: string;
  format: AudioFormat;
  quality?: Mp3Quality;
  cookies?: string;
}): Promise<DownloadJob> {
  await ensureLoaded();
  const quality = input.quality ?? DEFAULT_MP3_QUALITY;
  const existing = findReusable(input.videoId, input.format, quality);
  if (existing) return publicJob(existing);

  const jobId = newId("job");
  const now = Date.now();
  const job: JobInternal = {
    jobId,
    videoId: input.videoId,
    title: (input.title || input.videoId).trim() || input.videoId,
    format: input.format,
    quality,
    status: "queued",
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(jobId, job);
  cookiesByJob.set(jobId, input.cookies);
  const ac = new AbortController();
  controllers.set(jobId, ac);
  schedulePersist();
  void runJob(jobId);
  return publicJob(job);
}

export async function cancelJob(jobId: string): Promise<DownloadJob | null> {
  await ensureLoaded();
  const job = jobs.get(jobId);
  if (!job) return null;
  if (job.status === "done") return publicJob(job);
  controllers.get(jobId)?.abort();
  patch(jobId, { status: "cancelled", error: "отменено" });
  cookiesByJob.delete(jobId);
  return publicJob(jobs.get(jobId)!);
}

export async function streamJobFile(jobId: string): Promise<Response> {
  await ensureLoaded();
  const job = jobs.get(jobId);
  if (!job || job.status !== "done" || !job.filePath || !existsSync(job.filePath)) {
    return Response.json({ code: "NOT_FOUND", message: "Файл ещё не готов." }, { status: 404 });
  }
  return streamSavedFile(
    job.filePath,
    job.filename || `${safeFilename(job.title)}.${extensionFor(job.format)}`,
    job.mime || mimeFor(job.format),
  );
}

export async function streamJobsZip(jobIds: string[], zipName = "octava.zip"): Promise<Response> {
  await ensureLoaded();
  const zip = new JSZip();
  let packed = 0;
  const used = new Set<string>();
  for (const id of jobIds) {
    const job = jobs.get(id);
    if (!job || job.status !== "done" || !job.filePath || !existsSync(job.filePath)) continue;
    const buf = await readFile(job.filePath);
    if (buf.byteLength < 4_096) continue;
    packed += 1;
    let name = job.filename || `${safeFilename(job.title)}.${extensionFor(job.format)}`;
    if (used.has(name)) name = `${packed.toString().padStart(2, "0")} ${name}`;
    used.add(name);
    zip.file(`${packed.toString().padStart(2, "0")} ${name}`, buf);
  }
  if (packed === 0) {
    return Response.json({ code: "EMPTY", message: "Нет готовых файлов для архива." }, { status: 400 });
  }
  const body = await zip.generateAsync({ type: "uint8array", compression: "STORE" });
  const filename = zipName.endsWith(".zip") ? zipName : `${zipName}.zip`;
  return new Response(Buffer.from(body), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": contentDisposition(filename),
      "cache-control": "private, no-store",
    },
  });
}

export function jobErrorLog(): string {
  return dumpLogText(24);
}
