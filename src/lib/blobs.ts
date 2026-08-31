import type { AudioFormat, Mp3Quality } from "./media";
import { DEFAULT_MP3_QUALITY, blobKey } from "./media";

const blobs = new Map<string, Blob>();
const urls = new Map<string, string>();

export function getBlob(
  id: string,
  format: AudioFormat,
  quality: Mp3Quality = DEFAULT_MP3_QUALITY,
): Blob | undefined {
  return blobs.get(blobKey(id, format, quality));
}

export function hasBlob(
  id: string,
  format: AudioFormat,
  quality: Mp3Quality = DEFAULT_MP3_QUALITY,
): boolean {
  return blobs.has(blobKey(id, format, quality));
}

export function setBlob(
  id: string,
  format: AudioFormat,
  blob: Blob,
  quality: Mp3Quality = DEFAULT_MP3_QUALITY,
): string {
  const key = blobKey(id, format, quality);
  blobs.set(key, blob);
  const prev = urls.get(key);
  if (prev) URL.revokeObjectURL(prev);
  const next = URL.createObjectURL(blob);
  urls.set(key, next);
  return next;
}

export function getBlobUrl(
  id: string,
  format: AudioFormat,
  quality: Mp3Quality = DEFAULT_MP3_QUALITY,
): string | undefined {
  return urls.get(blobKey(id, format, quality));
}

export function clearBlobs(): void {
  for (const url of urls.values()) URL.revokeObjectURL(url);
  blobs.clear();
  urls.clear();
}
