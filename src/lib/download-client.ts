import { setBlob } from "./blobs";
import type { AudioFormat } from "./media";

export class DownloadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function fetchAudioBlob(
  id: string,
  format: AudioFormat,
  onProgress?: (ratio: number) => void,
  cookies?: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const res = await fetch("/api/audio", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id,
      format,
      cookies: cookies?.trim() ? cookies : undefined,
    }),
    signal,
  });
  if (!res.ok) {
    let code = "HTTP";
    let message = `Не удалось скачать (${res.status})`;
    try {
      const body = (await res.json()) as { code?: string; message?: string };
      if (body.code) code = body.code;
      if (body.message) message = body.message;
    } catch {
      /* keep defaults */
    }
    throw new DownloadError(code, message);
  }

  const total = Number(res.headers.get("content-length") ?? 0);
  if (!res.body) {
    const blob = await res.blob();
    setBlob(id, format, blob);
    return blob;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      if (total > 0) onProgress?.(Math.min(received / total, 0.99));
    }
  }
  const mime = res.headers.get("content-type") || "application/octet-stream";
  const copy = new ArrayBuffer(received);
  const view = new Uint8Array(copy);
  let offset = 0;
  for (const chunk of chunks) {
    view.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const blob = new Blob([copy], { type: mime });
  setBlob(id, format, blob);
  onProgress?.(1);
  return blob;
}
