import { getBlob, setBlob } from "./blobs";
import { cancelJob, DownloadError, fetchJobFile, startJob, waitForJob } from "./jobs-client";
import type { AudioFormat, Mp3Quality } from "./media";
import { DEFAULT_MP3_QUALITY } from "./media";

export { DownloadError };

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

  const started = await startJob({
    videoId: id,
    title,
    format,
    quality,
    cookies,
  });
  onProgress?.(Math.max(0.03, started.progress));

  let finished = started;
  if (started.status !== "done") {
    const onAbort = () => {
      void cancelJob(started.jobId);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    try {
      finished = await waitForJob(started.jobId, onProgress, signal);
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
  }

  const blob = await fetchJobFile(finished, quality);
  setBlob(id, format, blob, quality);
  onProgress?.(1);
  return blob;
}
