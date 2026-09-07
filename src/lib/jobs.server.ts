import { existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { copyFile, readFile, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  ExtractorError,
  extractAudio,
  streamSavedFile,
} from "./extractor.server";
import type { AudioFormat, DownloadJob, Mp3Quality } from "./media";
import { DEFAULT_MP3_QUALITY, extensionFor, mimeFor, newId, safeFilename } from "./media";
import { dumpLogText, getDownloadProgress } from "./yt-log.server";
import { pythonBin } from "./python.server";

type JobInternal = DownloadJob & { filePath?: string; duration?: number | null };

type JobsRt = {
  jobs: Map<string, JobInternal>;
  cookiesByJob: Map<string, string | undefined>;
  controllers: Map<string, AbortController>;
  loaded: boolean;
  persistTimer: ReturnType<typeof setTimeout> | null;
  jobsDir: string;
  pumping: boolean;
};

function rt(): JobsRt {
  const g = globalThis as typeof globalThis & { __octavaJobsRt?: JobsRt };
  if (!g.__octavaJobsRt) {
    g.__octavaJobsRt = {
      jobs: new Map(),
      cookiesByJob: new Map(),
      controllers: new Map(),
      loaded: false,
      persistTimer: null,
      jobsDir: "",
      pumping: false,
    };
  }
  return g.__octavaJobsRt;
}

const MAX_JOBS = 40;
const jobs = rt().jobs;
const cookiesByJob = rt().cookiesByJob;
const controllers = rt().controllers;

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
  return path.join(rt().jobsDir, "index.json");
}

async function ensureLoaded(): Promise<void> {
  if (rt().loaded) return;
  rt().loaded = true;
  rt().jobsDir = resolveDir();
  try {
    const raw = await readFile(indexPath(), "utf8");
    const parsed = JSON.parse(raw) as { jobs?: JobInternal[] };
    for (const job of parsed.jobs ?? []) {
      if (!job?.jobId) continue;
      if (!job.quality) job.quality = DEFAULT_MP3_QUALITY;
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
      } else if (job.status === "done" && (!job.filePath || !existsSync(job.filePath))) {
        job.status = "error";
        job.error = "файл пропал после перезапуска — скачайте снова";
        job.updatedAt = Date.now();
      }
      jobs.set(job.jobId, job);
    }
  } catch {
    /* first run */
  }
}

function schedulePersist(): void {
  if (rt().persistTimer) return;
  rt().persistTimer = setTimeout(() => {
    rt().persistTimer = null;
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
    const latest = Math.max(current.progress, getDownloadProgress() || 0);
    if (latest > current.progress) patch(jobId, { progress: latest });
  }, 350);
  try {
    const file = await extractAudio(
      job.videoId,
      job.format,
      cookiesByJob.get(jobId),
      job.quality,
      ac?.signal,
      (ratio) => {
        const current = jobs.get(jobId);
        if (!current || current.status !== "running") return;
        if (ratio > current.progress) patch(jobId, { progress: ratio });
      },
      { title: job.title, duration: job.duration },
    );
    const ext = path.extname(file.path) || `.${extensionFor(job.format, file.mime)}`;
    const dest = path.join(rt().jobsDir, `${job.jobId}${ext}`);
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
  duration?: number | null;
}): Promise<DownloadJob> {
  await ensureLoaded();
  const quality = input.quality ?? DEFAULT_MP3_QUALITY;
  const existing = findReusable(input.videoId, input.format, quality);
  if (existing) {
    if (input.cookies?.trim() && existing.status === "queued") {
      cookiesByJob.set(existing.jobId, input.cookies);
    }
    if (input.duration && !existing.duration) existing.duration = input.duration;
    return publicJob(existing);
  }

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
    duration: input.duration ?? null,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(jobId, job);
  cookiesByJob.set(jobId, input.cookies);
  const ac = new AbortController();
  controllers.set(jobId, ac);
  schedulePersist();
  void pumpQueue();
  return publicJob(job);
}

async function pumpQueue(): Promise<void> {
  if (rt().pumping) return;
  rt().pumping = true;
  try {
    for (;;) {
      const next = [...jobs.values()]
        .filter((job) => job.status === "queued")
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      if (!next) return;
      await runJob(next.jobId);
    }
  } finally {
    rt().pumping = false;
    if ([...jobs.values()].some((job) => job.status === "queued")) {
      void pumpQueue();
    }
  }
}

export async function cancelJob(jobId: string): Promise<DownloadJob | null> {
  await ensureLoaded();
  const job = jobs.get(jobId);
  if (!job) return null;
  if (job.status === "done") return publicJob(job);
  controllers.get(jobId)?.abort();
  controllers.delete(jobId);
  cookiesByJob.delete(jobId);
  patch(jobId, { status: "cancelled", error: "отменено" });
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

type ZipBundle = {
  id: string;
  path: string;
  filename: string;
  bytes: number;
  createdAt: number;
  fingerprint: string;
};

function zipRt(): Map<string, ZipBundle> {
  const g = globalThis as typeof globalThis & { __octavaZipRt?: Map<string, ZipBundle> };
  if (!g.__octavaZipRt) g.__octavaZipRt = new Map();
  return g.__octavaZipRt;
}

function zipDir(): string {
  const dir = path.join(rt().jobsDir || resolveDir(), "zips");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function zipIndexPath(): string {
  return path.join(zipDir(), "index.json");
}

function persistZips(): void {
  const payload = JSON.stringify({ bundles: [...zipRt().values()] });
  void writeFile(zipIndexPath(), payload, "utf8").catch(() => undefined);
}

async function loadZips(): Promise<void> {
  const g = globalThis as typeof globalThis & { __octavaZipLoaded?: boolean };
  if (g.__octavaZipLoaded) return;
  g.__octavaZipLoaded = true;
  try {
    const raw = await readFile(zipIndexPath(), "utf8");
    const parsed = JSON.parse(raw) as { bundles?: ZipBundle[] };
    for (const bundle of parsed.bundles ?? []) {
      if (!bundle?.id || !bundle.path || !bundle.fingerprint || !existsSync(bundle.path)) continue;
      zipRt().set(bundle.id, bundle);
    }
  } catch {
    /* first run */
  }
}

async function pruneZips(): Promise<void> {
  await loadZips();
  const store = zipRt();
  const maxAge = 12 * 60 * 60 * 1000;
  const now = Date.now();
  let changed = false;
  for (const [id, bundle] of store) {
    if (existsSync(bundle.path) && now - bundle.createdAt <= maxAge) continue;
    store.delete(id);
    await unlink(bundle.path).catch(() => undefined);
    changed = true;
  }
  const extra = [...store.values()].sort((a, b) => a.createdAt - b.createdAt);
  while (extra.length > 8) {
    const old = extra.shift();
    if (!old) break;
    store.delete(old.id);
    await unlink(old.path).catch(() => undefined);
    changed = true;
  }
  if (changed) persistZips();
}

function fingerprintFor(entries: Array<{ path: string; name: string; size: number }>): string {
  return entries
    .map((entry) => `${entry.path}:${entry.size}`)
    .sort()
    .join("|");
}

function findReadyZip(fingerprint: string): ZipBundle | undefined {
  for (const bundle of zipRt().values()) {
    if (bundle.fingerprint === fingerprint && existsSync(bundle.path)) return bundle;
  }
  return undefined;
}

function packZipWithPython(
  outPath: string,
  entries: Array<{ path: string; name: string }>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      pythonBin(),
      [
        "-c",
        "import json,sys,zipfile\n" +
          "out,entries=json.load(sys.stdin)\n" +
          "with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_STORED,allowZip64=True) as z:\n" +
          "  for e in entries: z.write(e['path'], e['name'])\n",
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `zip exit ${code}`));
    });
    child.stdin.end(JSON.stringify([outPath, entries]));
  });
}

export async function buildJobsZip(
  jobIds: string[],
  zipName = "octava.zip",
): Promise<{ id: string; filename: string; bytes: number; reused?: boolean } | Response> {
  await ensureLoaded();
  await pruneZips();
  const entries: Array<{ path: string; name: string; size: number }> = [];
  const used = new Set<string>();
  let packed = 0;
  for (const id of jobIds) {
    const job = jobs.get(id);
    if (!job || job.status !== "done" || !job.filePath || !existsSync(job.filePath)) continue;
    const info = await stat(job.filePath).catch(() => null);
    if (!info || info.size < 4_096) continue;
    packed += 1;
    let name = job.filename || `${safeFilename(job.title)}.${extensionFor(job.format)}`;
    if (used.has(name)) name = `${packed.toString().padStart(2, "0")} ${name}`;
    used.add(name);
    entries.push({
      path: job.filePath,
      name: `${packed.toString().padStart(2, "0")} ${name}`,
      size: info.size,
    });
  }
  if (entries.length === 0) {
    return Response.json(
      { code: "EMPTY", message: "Нет готовых файлов для архива. Скачайте треки ещё раз." },
      { status: 400 },
    );
  }
  const filename = zipName.endsWith(".zip") ? zipName : `${zipName}.zip`;
  const fingerprint = fingerprintFor(entries);
  const ready = findReadyZip(fingerprint);
  if (ready) {
    const info = await stat(ready.path).catch(() => null);
    if (info && info.size >= 64) {
      ready.filename = filename;
      ready.bytes = info.size;
      persistZips();
      return { id: ready.id, filename, bytes: info.size, reused: true };
    }
  }
  const id = newId("zip");
  const outPath = path.join(zipDir(), `${id}.zip`);
  try {
    await packZipWithPython(
      outPath,
      entries.map(({ path: filePath, name }) => ({ path: filePath, name })),
    );
    const info = await stat(outPath);
    zipRt().set(id, {
      id,
      path: outPath,
      filename,
      bytes: info.size,
      createdAt: Date.now(),
      fingerprint,
    });
    persistZips();
    return { id, filename, bytes: info.size, reused: false };
  } catch (err) {
    await unlink(outPath).catch(() => undefined);
    return Response.json(
      {
        code: "ZIP",
        message: err instanceof Error ? err.message : "Не удалось собрать ZIP",
      },
      { status: 500 },
    );
  }
}

export async function streamPackedZip(id: string): Promise<Response> {
  await ensureLoaded();
  const bundle = zipRt().get(id);
  if (!bundle || !existsSync(bundle.path)) {
    return Response.json({ code: "NOT_FOUND", message: "Архив уже недоступен. Соберите ZIP снова." }, { status: 404 });
  }
  return streamSavedFile(bundle.path, bundle.filename, "application/zip");
}

export async function streamJobsZip(jobIds: string[], zipName = "octava.zip"): Promise<Response> {
  const built = await buildJobsZip(jobIds, zipName);
  if (built instanceof Response) return built;
  return streamPackedZip(built.id);
}

export function jobErrorLog(): string {
  return dumpLogText(24);
}
