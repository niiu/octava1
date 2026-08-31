import type { AudioFormat } from "./media";
import { blobKey } from "./media";

const blobs = new Map<string, Blob>();
const urls = new Map<string, string>();

export function getBlob(id: string, format: AudioFormat): Blob | undefined {
  return blobs.get(blobKey(id, format));
}

export function hasBlob(id: string, format: AudioFormat): boolean {
  return blobs.has(blobKey(id, format));
}

export function setBlob(id: string, format: AudioFormat, blob: Blob): string {
  const key = blobKey(id, format);
  blobs.set(key, blob);
  const prev = urls.get(key);
  if (prev) URL.revokeObjectURL(prev);
  const next = URL.createObjectURL(blob);
  urls.set(key, next);
  return next;
}

export function getBlobUrl(id: string, format: AudioFormat): string | undefined {
  return urls.get(blobKey(id, format));
}

export function clearBlobs(): void {
  for (const url of urls.values()) URL.revokeObjectURL(url);
  blobs.clear();
  urls.clear();
}
