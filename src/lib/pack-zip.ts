import JSZip from "jszip";
import { getBlob } from "./blobs";
import type { AudioFormat, Mp3Quality, Track } from "./media";
import { DEFAULT_MP3_QUALITY, extensionFor, safeFilename } from "./media";

export async function packTracksZip(
  tracks: Track[],
  format: AudioFormat,
  onProgress?: (done: number, total: number, title: string) => void,
  quality: Mp3Quality = DEFAULT_MP3_QUALITY,
): Promise<{ blob: Blob; packed: number; skipped: string[] }> {
  const zip = new JSZip();
  const skipped: string[] = [];
  let packed = 0;
  const total = tracks.length;

  for (const track of tracks) {
    onProgress?.(packed, total, track.title);
    const blob = getBlob(track.id, format, quality);
    if (!blob) {
      skipped.push(track.title);
      continue;
    }
    packed += 1;
    const ext = extensionFor(format, blob.type);
    const index = String(packed).padStart(2, "0");
    zip.file(`${index} ${safeFilename(track.title)}.${ext}`, blob);
  }

  onProgress?.(packed, total, "");
  const out = await zip.generateAsync({
    type: "blob",
    compression: "STORE",
  });
  return { blob: out, packed, skipped };
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 8_000);
}
