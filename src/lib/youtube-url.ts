export type ParsedInput =
  | { kind: "empty" }
  | { kind: "video"; videoId: string; playlistId?: string }
  | { kind: "playlist"; playlistId: string }
  | { kind: "search"; query: string };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,}$/;

function pickParam(url: URL, key: string): string | undefined {
  const value = url.searchParams.get(key);
  return value && value.length > 0 ? value : undefined;
}

function hostIsYoutube(host: string): boolean {
  const h = host.replace(/^www\./, "").toLowerCase();
  return (
    h === "youtube.com" ||
    h === "m.youtube.com" ||
    h === "music.youtube.com" ||
    h === "youtube-nocookie.com" ||
    h === "youtu.be"
  );
}

export function parseYoutubeInput(raw: string): ParsedInput {
  const input = raw.trim();
  if (!input) return { kind: "empty" };

  const looksUrl = /^(https?:\/\/|www\.|youtu\.be\/|youtube\.com\/)/i.test(input);
  if (!looksUrl) {
    if (VIDEO_ID.test(input)) return { kind: "video", videoId: input };
    return { kind: "search", query: input };
  }

  let href = input;
  if (!/^https?:\/\//i.test(href)) href = `https://${href}`;

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { kind: "search", query: input };
  }

  if (!hostIsYoutube(url.hostname)) {
    return { kind: "search", query: input };
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  const videoParam = pickParam(url, "v");
  const listParam = pickParam(url, "list");
  const isNamedPlaylist =
    Boolean(listParam) &&
    (listParam!.startsWith("PL") ||
      listParam!.startsWith("OL") ||
      listParam!.startsWith("UU") ||
      listParam!.startsWith("FL"));

  if (host === "youtu.be" && parts[0] && VIDEO_ID.test(parts[0])) {
    return {
      kind: "video",
      videoId: parts[0],
      playlistId: isNamedPlaylist ? listParam : undefined,
    };
  }

  if (parts[0] === "shorts" && parts[1] && VIDEO_ID.test(parts[1])) {
    return { kind: "video", videoId: parts[1] };
  }
  if (parts[0] === "embed" && parts[1] && VIDEO_ID.test(parts[1])) {
    return { kind: "video", videoId: parts[1] };
  }
  if (parts[0] === "live" && parts[1] && VIDEO_ID.test(parts[1])) {
    return { kind: "video", videoId: parts[1] };
  }

  if (parts[0] === "playlist" && listParam && PLAYLIST_ID.test(listParam)) {
    return { kind: "playlist", playlistId: listParam };
  }

  if (videoParam && VIDEO_ID.test(videoParam)) {
    if (isNamedPlaylist) {
      return {
        kind: "video",
        videoId: videoParam,
        playlistId: listParam,
      };
    }
    return { kind: "video", videoId: videoParam };
  }

  if (listParam && PLAYLIST_ID.test(listParam)) {
    return { kind: "playlist", playlistId: listParam };
  }

  return { kind: "search", query: input };
}

export function toYtdlpTarget(parsed: Exclude<ParsedInput, { kind: "empty" }>): string {
  if (parsed.kind === "search") return `ytsearch8:${parsed.query}`;
  if (parsed.kind === "playlist") {
    return `https://www.youtube.com/playlist?list=${parsed.playlistId}`;
  }
  if (parsed.playlistId) {
    return `https://www.youtube.com/watch?v=${parsed.videoId}&list=${parsed.playlistId}`;
  }
  return `https://www.youtube.com/watch?v=${parsed.videoId}`;
}
