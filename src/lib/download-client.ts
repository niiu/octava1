import { getBlob, setBlob } from "./blobs";
import { cancelJob, DownloadError, fetchJobFile, startJob, waitForJob } from "./jobs-client";
import type { AudioFormat, DownloadJob, Mp3Quality } from "./media";
import { DEFAULT_MP3_QUALITY } from "./media";

export { DownloadError };

export async function ensureServerJob(
  id: string,
  format: AudioFormat,
  onProgress?: (ratio: number) => void,
  cookies?: string,
  quality: Mp3Quality = DEFAULT_MP3_QUALITY,
  signal?: AbortSignal,
  title?: string,
): Promise<DownloadJob> {
  const cached = getBlob(id, format, quality);
  if (cached && cached.size >= 4_096) {
    onProgress?.(1);
  }

  const started = await startJob({
    videoId: id,
    title,
    format,
    quality,
    cookies,
  });
  onProgress?.(Math.max(0.03, started.progress));
  if (started.status === "done" || started.status === "error") return started;
  if (started.status === "cancelled") {
    throw new DOMException("Aborted", "AbortError");
  }

  const onAbort = () => {
    void cancelJob(started.jobId);
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    return await waitForJob(started.jobId, onProgress, signal);
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}

export async function fetchAudioBlob(
  id: string,
  format: AudioFormat,
  onProgress?: (ratio: number) => void,
  cookies?: string,
  quality: Mp3Quality = DEFAULT_MP3_QUALITY,
  signal?: AbortSignal,
  title?: string,
): Promise<Blob> {
  const cached = getBlob(id, format, quality);
  if (cached && cached.size >= 4_096) {
    onProgress?.(1);
    return cached;
  }
  const finished = await ensureServerJob(id, format, onProgress, cookies, quality, signal, title);
  if (finished.status !== "done") {
    throw new DownloadError("JOB", finished.error || "Не удалось скачать");
  }
  const blob = await fetchJobFile(finished, quality);
  setBlob(id, format, blob, quality);
  onProgress?.(1);
  return blob;
}
