import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  Check,
  Download,
  FolderPlus,
  History,
  ListMusic,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Wordmark } from "@/components/octava/logo";
import { CookiesPanel } from "@/components/octava/cookies-panel";
import { YtConsole } from "@/components/octava/console";
import { getBlobUrl, hasBlob } from "@/lib/blobs";
import { DownloadError, fetchAudioBlob } from "@/lib/download-client";
import { getExtractorCaps, resolveMedia } from "@/lib/media.functions";
import { cookiePayload, loadStoredCookies } from "@/lib/cookies-client";
import { countCookieRows } from "@/lib/cookie-file";
import { ingestYtText, noteYt, getYtDownloadRatio, resetYtDownloadRatio, subscribeYtLog } from "@/lib/yt-log-client";
import type { AudioFormat, ExtractorCaps, Mp3Quality, ResolveResult, Track } from "@/lib/media";
import {
  FORMAT_LABEL,
  MP3_QUALITIES,
  MP3_QUALITY_LABEL,
  DEFAULT_MP3_QUALITY,
  blobKey,
  formatBytes,
  formatDuration,
  safeFilename,
  extensionFor,
} from "@/lib/media";
import { packTracksZip, saveBlob } from "@/lib/pack-zip";
import { useLibrary } from "@/lib/store";
import { cn } from "@/lib/utils";

type ZipPhase = {
  open: boolean;
  current: string;
  done: number;
  total: number;
  packing: boolean;
  skipped: number;
};

const ZIP_IDLE: ZipPhase = {
  open: false,
  current: "",
  done: 0,
  total: 0,
  packing: false,
  skipped: 0,
};

function isAbortError(err: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" && err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

export function OctavaApp() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [caps, setCaps] = useState<ExtractorCaps | null>(null);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState<string | "inbox" | "history">(
    "inbox",
  );
  const [newPlOpen, setNewPlOpen] = useState(false);
  const [newPlName, setNewPlName] = useState("");
  const [pendingAdd, setPendingAdd] = useState<string[] | null>(null);
  const [zip, setZip] = useState<ZipPhase>(ZIP_IDLE);
  const zipAbort = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [cookies, setCookies] = useState("");
  const [cookieCount, setCookieCount] = useState(0);

  const format = useLibrary((s) => s.format);
  const setFormat = useLibrary((s) => s.setFormat);
  const mp3Quality = useLibrary((s) => s.mp3Quality) ?? DEFAULT_MP3_QUALITY;
  const setMp3Quality = useLibrary((s) => s.setMp3Quality);
  const catalog = useLibrary((s) => s.catalog);
  const remember = useLibrary((s) => s.remember);
  const playlists = useLibrary((s) => s.playlists);
  const selectedIds = useLibrary((s) => s.selectedIds);
  const toggleSelected = useLibrary((s) => s.toggleSelected);
  const setSelected = useLibrary((s) => s.setSelected);
  const clearSelected = useLibrary((s) => s.clearSelected);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const deletePlaylist = useLibrary((s) => s.deletePlaylist);
  const addToPlaylist = useLibrary((s) => s.addToPlaylist);
  const removeFromPlaylist = useLibrary((s) => s.removeFromPlaylist);
  const historyIds = useLibrary((s) => s.historyIds);
  const clearHistory = useLibrary((s) => s.clearHistory);

  useEffect(() => {
    void useLibrary.persist.rehydrate();
  }, []);

  useEffect(() => {
    const local = countCookieRows(loadStoredCookies());
    if (local > 0) setCookieCount(local);
    void getExtractorCaps()
      .then((next) => {
        setCaps(next);
        setCookieCount((prev) => Math.max(prev, next.cookieCount, local));
      })
      .catch(() =>
        setCaps({
          ytdlp: false,
          ffmpeg: false,
          python: null,
          cookies: false,
          cookieCount: 0,
        }),
      );
  }, []);

  const ytRatio = useSyncExternalStore(subscribeYtLog, getYtDownloadRatio, getYtDownloadRatio);

  const inboxTracks = useMemo(() => {
    if (!result) return [];
    if (result.kind === "video") return [result.track];
    return result.tracks;
  }, [result]);

  const visibleTracks: Track[] = useMemo(() => {
    if (activePlaylistId === "inbox") return inboxTracks;
    if (activePlaylistId === "history") {
      return historyIds.map((id) => catalog[id]).filter(Boolean);
    }
    const pl = playlists.find((p) => p.id === activePlaylistId);
    if (!pl) return [];
    return pl.trackIds.map((id) => catalog[id]).filter(Boolean);
  }, [activePlaylistId, inboxTracks, historyIds, catalog, playlists]);

  const selectedVisible = visibleTracks.filter((t) => selectedIds.includes(t.id));
  const allVisibleSelected =
    visibleTracks.length > 0 && selectedVisible.length === visibleTracks.length;
  const someVisibleSelected = selectedVisible.length > 0 && !allVisibleSelected;

  function toggleAllVisible() {
    if (allVisibleSelected) clearSelected();
    else setSelected(visibleTracks.map((t) => t.id));
  }

  async function onResolve(event?: FormEvent) {
    event?.preventDefault();
    const q = input.trim();
    if (!q) return;
    setBusy(true);
    noteYt("info", `запрос: ${q}`);
    try {
      const out = await resolveMedia({ data: { input: q, cookies: cookiePayload(cookies) } });
      ingestYtText(out.log);
      if (!out.ok) {
        noteYt("error", out.message);
        toast.error(out.message);
        return;
      }
      const next = out.result;
      setResult(next);
      const tracks = next.kind === "video" ? [next.track] : next.tracks;
      remember(tracks);
      setActivePlaylistId("inbox");
      clearSelected();
      if (tracks.length === 0) {
        toast.message("Ничего не найдено");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось разобрать ссылку";
      noteYt("error", message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function playTrack(track: Track) {
    setNowPlaying(track);
    setPlaying(true);
  }

  async function downloadOne(track: Track) {
    setFetchingId(track.id);
    resetYtDownloadRatio();
    setProgress((p) => ({ ...p, [track.id]: 0.03 }));
    noteYt("info", `скачивание «${track.title}»`);
    try {
      const blob = await fetchAudioBlob(track.id, format, (ratio) => {
        setProgress((p) => ({ ...p, [track.id]: ratio }));
      }, cookiePayload(cookies), mp3Quality);
      setReady((r) => ({ ...r, [blobKey(track.id, format, mp3Quality)]: true }));
      const ext = extensionFor(format, blob.type);
      saveBlob(blob, `${safeFilename(track.title)}.${ext}`);
      noteYt("ok", `сохранено «${track.title}»`);
      toast.success("Файл сохранён");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка загрузки";
      noteYt("error", `${track.title}: ${message}`);
      if (err instanceof DownloadError) ingestYtText(err.log, "error");
      toast.error(message);
    } finally {
      setFetchingId(null);
      setProgress((p) => {
        const next = { ...p };
        delete next[track.id];
        return next;
      });
    }
  }

  function cancelZip() {
    zipAbort.current?.abort();
    noteYt("warn", "отмена");
  }

  async function packSelected() {
    const tracks = selectedVisible;
    if (tracks.length === 0) {
      toast.message("Отметьте хотя бы один трек");
      return;
    }
    if (zipAbort.current) return;
    const ac = new AbortController();
    zipAbort.current = ac;
    setZip({
      open: true,
      current: "",
      done: 0,
      total: tracks.length,
      packing: false,
      skipped: 0,
    });
    const ok: Track[] = [];
    let skipped = 0;
    let cancelled = false;
    for (let i = 0; i < tracks.length; i++) {
      if (ac.signal.aborted) {
        cancelled = true;
        break;
      }
      const track = tracks[i]!;
      setFetchingId(track.id);
      resetYtDownloadRatio();
      setProgress((p) => ({ ...p, [track.id]: 0.03 }));
      setZip((z) => ({ ...z, current: track.title, packing: false }));
      if (hasBlob(track.id, format, mp3Quality) || ready[blobKey(track.id, format, mp3Quality)]) {
        ok.push(track);
        setZip((z) => ({ ...z, done: i + 1 }));
        setProgress((p) => {
          const next = { ...p };
          delete next[track.id];
          return next;
        });
        continue;
      }
      try {
        await fetchAudioBlob(
          track.id,
          format,
          (ratio) => {
            setProgress((p) => ({ ...p, [track.id]: ratio }));
          },
          cookiePayload(cookies),
          mp3Quality,
          ac.signal,
        );
        setReady((r) => ({ ...r, [blobKey(track.id, format, mp3Quality)]: true }));
        ok.push(track);
      } catch (err) {
        if (ac.signal.aborted || isAbortError(err)) {
          cancelled = true;
          noteYt("warn", `остановлено на «${track.title}»`);
          break;
        }
        skipped += 1;
        const message = err instanceof Error ? err.message : "не скачался";
        noteYt("error", `${track.title}: ${message}`);
        noteYt("warn", `пропуск «${track.title}», следующий`);
        if (err instanceof DownloadError) ingestYtText(err.log, "error");
        setZip((z) => ({ ...z, skipped: z.skipped + 1 }));
      } finally {
        setFetchingId(null);
        if (!cancelled) setZip((z) => ({ ...z, done: i + 1 }));
        setProgress((p) => {
          const next = { ...p };
          delete next[track.id];
          return next;
        });
      }
    }
    setFetchingId(null);
    if (cancelled) {
      zipAbort.current = null;
      toast.message("Отменено");
      setZip(ZIP_IDLE);
      return;
    }
    if (ok.length === 0) {
      zipAbort.current = null;
      toast.error(
        skipped > 0
          ? `Не удалось скачать выбранные треки (${skipped})`
          : "В архив не попало ни одного файла",
      );
      setZip(ZIP_IDLE);
      return;
    }
    setZip((z) => ({ ...z, packing: true, current: "Упаковка ZIP" }));
    try {
      const packed = await packTracksZip(ok, format, (done, total, title) => {
        setZip((z) => ({
          ...z,
          done,
          total,
          current: title || "Упаковка ZIP",
          packing: true,
        }));
      }, mp3Quality);
      if (packed.packed === 0) {
        toast.error("В архив не попало ни одного файла");
      } else {
        const stamp = new Date().toISOString().slice(0, 10);
        const name =
          result?.kind === "playlist"
            ? safeFilename(result.title)
            : "octava";
        saveBlob(packed.blob, `${name}-${stamp}.zip`);
        const skipN = skipped + packed.skipped.length;
        toast.success(
          skipN > 0
            ? `ZIP: ${packed.packed} файл(ов), пропуск ${skipN}`
            : `ZIP: ${packed.packed} файл(ов)`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось собрать ZIP");
    } finally {
      zipAbort.current = null;
      setZip(ZIP_IDLE);
    }
  }

  function submitNewPlaylist() {
    const id = createPlaylist(newPlName);
    if (pendingAdd && pendingAdd.length > 0) addToPlaylist(id, pendingAdd);
    setNewPlName("");
    setNewPlOpen(false);
    setPendingAdd(null);
    toast.success("Сборка создана");
  }

  const heading =
    activePlaylistId === "history"
      ? "История"
      : activePlaylistId === "inbox"
        ? result?.kind === "playlist"
          ? result.title
          : result?.kind === "search"
            ? `Поиск: ${result.query}`
            : result?.kind === "video"
              ? "Ролик"
              : "Лента"
        : playlists.find((p) => p.id === activePlaylistId)?.name ?? "Сборка";

  const sub =
    activePlaylistId === "inbox" && result?.kind === "playlist"
      ? `${result.tracks.length} треков${result.channel ? ` · ${result.channel}` : ""}`
      : `${visibleTracks.length} записей`;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link to="/" className="shrink-0">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/install"
            className="inline-flex h-11 items-center rounded-md px-3 text-sm text-muted hover:bg-raised hover:text-fg"
          >
            Установка
          </Link>
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-36 md:flex-row md:px-8">
        <aside className="order-2 flex w-full shrink-0 flex-col gap-3 md:order-1 md:w-64">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Сборки</p>
          <RailButton
            active={activePlaylistId === "inbox"}
            onClick={() => setActivePlaylistId("inbox")}
            icon={<Search className="size-4" />}
            label="Лента"
            hint={inboxTracks.length ? String(inboxTracks.length) : undefined}
          />
          <RailButton
            active={activePlaylistId === "history"}
            onClick={() => setActivePlaylistId("history")}
            icon={<History className="size-4" />}
            label="История"
            hint={historyIds.length ? String(historyIds.length) : undefined}
          />
          <Separator className="my-1" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">Мои</p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Новая сборка"
              onClick={() => {
                setPendingAdd(null);
                setNewPlOpen(true);
              }}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {playlists.length === 0 ? (
            <p className="text-sm text-subtle">Пока пусто — сложите треки в сборку.</p>
          ) : (
            playlists.map((pl) => (
              <div key={pl.id} className="group flex items-center gap-1">
                <RailButton
                  className="flex-1"
                  active={activePlaylistId === pl.id}
                  onClick={() => setActivePlaylistId(pl.id)}
                  icon={<ListMusic className="size-4" />}
                  label={pl.name}
                  hint={String(pl.trackIds.length)}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-70 md:opacity-0 md:group-hover:opacity-100"
                  aria-label={`Удалить ${pl.name}`}
                  onClick={() => {
                    deletePlaylist(pl.id);
                    if (activePlaylistId === pl.id) setActivePlaylistId("inbox");
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </aside>

        <main className="order-1 min-w-0 flex-1 md:order-2">
          <form onSubmit={onResolve} className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="octava-q">
              Ссылка или поиск
            </label>
            <Input
              id="octava-q"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ссылка на ролик, плейлист или просто запрос"
              autoComplete="off"
              className="flex-1"
            />
            <Button type="submit" disabled={busy} className="h-12 shrink-0 sm:w-36">
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Найти
            </Button>
          </form>

          <div className="mt-3">
            <CookiesPanel
              value={cookies}
              onChange={setCookies}
              savedCount={cookieCount}
              onStatus={(count) => {
                setCookieCount(count);
                setCaps((prev) =>
                  prev
                    ? { ...prev, cookies: count > 0, cookieCount: count }
                    : prev,
                );
              }}
            />
          </div>

          <div className="mt-3">
            <YtConsole busy={busy || zip.open || Object.keys(progress).length > 0} />
          </div>

          {caps && !caps.ytdlp ? (
            <p className="mt-3 text-sm text-danger">
              Движок yt-dlp не найден.{" "}
              <Link to="/install" className="underline">
                Установите Octava
              </Link>
              , чтобы скачивать файлы.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl leading-tight tracking-tight md:text-4xl">
                {heading}
              </h1>
              <p className="mt-1 text-sm text-muted">{sub}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FormatSwitch
                value={format}
                ffmpeg={caps?.ffmpeg ?? false}
                onChange={setFormat}
                mp3Quality={mp3Quality}
                onMp3Quality={setMp3Quality}
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={selectedVisible.length === 0}
                onClick={() => {
                  setPendingAdd(selectedVisible.map((t) => t.id));
                  if (playlists.length === 0) {
                    setNewPlOpen(true);
                    return;
                  }
                  const first = playlists[0]!;
                  addToPlaylist(first.id, selectedVisible.map((t) => t.id));
                  toast.success(`Добавлено в «${first.name}»`);
                }}
              >
                <FolderPlus className="size-4" />
                В сборку
              </Button>
              <Button
                variant="sage"
                size="sm"
                disabled={selectedVisible.length === 0 || zip.open}
                onClick={() => void packSelected()}
              >
                <Archive className="size-4" />
                ZIP · {selectedVisible.length || 0}
              </Button>
            </div>
          </div>

          {zip.open ? (
            <div
              id="octava-job"
              className="mt-4 rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {zip.packing ? "Собираем архив" : "Качаем треки"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">{zip.current || "…"}</p>
                </div>
                <Button
                  id="octava-job-cancel"
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={cancelZip}
                >
                  Отмена
                </Button>
              </div>
              <Progress
                id="octava-zip-progress"
                className="mt-3"
                value={
                  !zip.total
                    ? 3
                    : zip.packing || (!fetchingId && zip.done >= zip.total)
                      ? 100
                      : Math.min(
                          99,
                          Math.round(
                            ((zip.done +
                              (fetchingId ? Math.max(ytRatio, 0.03) * 0.95 : 0)) /
                              zip.total) *
                              100,
                          ),
                        )
                }
              />
              <p className="mt-2 font-mono text-xs tabular-nums text-muted">
                {zip.done} / {zip.total}
                {zip.skipped > 0 ? ` · пропуск ${zip.skipped}` : ""}
                {!zip.packing && fetchingId
                  ? ` · ${Math.round(Math.max(ytRatio, progress[fetchingId] ?? 0) * 100)}%`
                  : ""}
              </p>
            </div>
          ) : null}

          {visibleTracks.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="mt-6">
              <div className="flex min-h-11 items-center gap-3 border-b border-line">
                <Checkbox
                  id="octava-select-all"
                  checked={
                    allVisibleSelected
                      ? true
                      : someVisibleSelected
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={() => toggleAllVisible()}
                  aria-label={allVisibleSelected ? "Снять все" : "Отметить все"}
                />
                <label
                  htmlFor="octava-select-all"
                  className="flex min-h-11 min-w-0 cursor-pointer items-center text-sm text-muted"
                >
                  {selectedVisible.length > 0
                    ? `Выбрано ${selectedVisible.length} из ${visibleTracks.length}`
                    : "Отметить все"}
                </label>
              </div>
              <ul className="divide-y divide-line">
              {visibleTracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  checked={selectedIds.includes(track.id)}
                  onCheck={() => toggleSelected(track.id)}
                  progress={
                    fetchingId === track.id
                      ? Math.max(progress[track.id] ?? 0.03, ytRatio)
                      : progress[track.id]
                  }
                  saved={Boolean(
                    ready[blobKey(track.id, format, mp3Quality)] ||
                      hasBlob(track.id, format, mp3Quality),
                  )}
                  isPlaying={nowPlaying?.id === track.id && playing}
                  onPlay={() => playTrack(track)}
                  onDownload={() => void downloadOne(track)}
                  onAdd={() => {
                    if (playlists.length === 0) {
                      setPendingAdd([track.id]);
                      setNewPlOpen(true);
                      return;
                    }
                    addToPlaylist(playlists[0]!.id, [track.id]);
                    toast.success(`«${track.title}» в сборке`);
                  }}
                  onRemove={
                    activePlaylistId !== "inbox" && activePlaylistId !== "history"
                      ? () => removeFromPlaylist(activePlaylistId, track.id)
                      : undefined
                  }
                />
              ))}
            </ul>
            </div>
          )}

          {activePlaylistId === "history" && historyIds.length > 0 ? (
            <Button variant="ghost" className="mt-4" onClick={clearHistory}>
              Очистить историю
            </Button>
          ) : null}

          <p className="mt-10 mb-4 text-xs text-subtle">
            Скачивайте только то, на что у вас есть права. Octava — инструмент для личной
            архивации, не обход лицензий.
          </p>
        </main>
      </div>

      {nowPlaying ? (
        <PlayerBar
          track={nowPlaying}
          playing={playing}
          hasFile={Boolean(
            ready[blobKey(nowPlaying.id, format, mp3Quality)] ||
              hasBlob(nowPlaying.id, format, mp3Quality),
          )}
          format={format}
          quality={mp3Quality}
          onToggle={() => setPlaying((v) => !v)}
          onClose={() => {
            setPlaying(false);
            setNowPlaying(null);
          }}
        />
      ) : null}

      <Dialog open={newPlOpen} onOpenChange={setNewPlOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая сборка</DialogTitle>
            <DialogDescription>Локальный плейлист — хранится в этом браузере.</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submitNewPlaylist();
            }}
          >
            <Input
              value={newPlName}
              onChange={(e) => setNewPlName(e.target.value)}
              placeholder="Дорога, ночь, архив…"
              autoFocus
            />
            {playlists.length > 0 && pendingAdd ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted">или добавить в существующую</p>
                {playlists.map((pl) => (
                  <Button
                    key={pl.id}
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      addToPlaylist(pl.id, pendingAdd);
                      setNewPlOpen(false);
                      setPendingAdd(null);
                      toast.success(`Добавлено в «${pl.name}»`);
                    }}
                  >
                    {pl.name}
                  </Button>
                ))}
              </div>
            ) : null}
            <Button type="submit">Создать</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RailButton({
  active,
  onClick,
  icon,
  label,
  hint,
  className,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm",
        active ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg",
        className,
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint ? <span className="font-mono text-xs tabular-nums text-subtle">{hint}</span> : null}
    </button>
  );
}

function FormatSwitch({
  value,
  onChange,
  ffmpeg,
  mp3Quality,
  onMp3Quality,
}: {
  value: AudioFormat;
  onChange: (v: AudioFormat) => void;
  ffmpeg: boolean;
  mp3Quality: Mp3Quality;
  onMp3Quality: (q: Mp3Quality) => void;
}) {
  const options: AudioFormat[] = ffmpeg ? ["m4a", "mp3", "source"] : ["m4a", "source"];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md bg-raised p-1 shadow-[var(--shadow-border)]">
        {options.map((opt) => (
          <button
            key={opt}
            id={`octava-format-${opt}`}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "h-8 rounded-sm px-2.5 text-xs font-medium",
              value === opt ? "bg-fg text-bg" : "text-muted hover:text-fg",
            )}
          >
            {FORMAT_LABEL[opt]}
          </button>
        ))}
      </div>
      {value === "mp3" && ffmpeg ? (
        <div
          className="flex items-center gap-1 rounded-md bg-raised p-1 shadow-[var(--shadow-border)]"
          role="group"
          aria-label="Качество MP3, кбит/с"
        >
          {MP3_QUALITIES.map((q) => (
            <button
              key={q}
              id={`octava-mp3-q-${q}`}
              type="button"
              onClick={() => onMp3Quality(q)}
              className={cn(
                "h-8 rounded-sm px-2.5 font-mono text-xs font-medium tabular-nums",
                mp3Quality === q ? "bg-fg text-bg" : "text-muted hover:text-fg",
              )}
            >
              {MP3_QUALITY_LABEL[q]}
            </button>
          ))}
          <span className="pr-2 pl-0.5 text-xs text-subtle">кбит/с</span>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-start gap-3">
      <p className="font-display text-2xl tracking-tight">Кассета ещё пустая</p>
      <p className="max-w-md text-sm text-muted">
        Вставьте ссылку на ролик или плейлист YouTube — или просто начните искать. Можно
        отметить несколько дорожек и упаковать их в ZIP.
      </p>
    </div>
  );
}

function TrackRow({
  track,
  checked,
  onCheck,
  progress,
  saved,
  isPlaying,
  onPlay,
  onDownload,
  onAdd,
  onRemove,
}: {
  track: Track;
  checked: boolean;
  onCheck: () => void;
  progress?: number;
  saved: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onDownload: () => void;
  onAdd: () => void;
  onRemove?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheck}
        aria-label={`Выбрать ${track.title}`}
        className="mt-0.5"
      />
      <button
        type="button"
        onClick={onPlay}
        className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-raised"
        aria-label={`Слушать ${track.title}`}
      >
        <img
          src={track.thumbnail}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full object-cover outline outline-1 -outline-offset-1 outline-fg/10"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-bg/40">
          {isPlaying ? (
            <span className="flex h-4 items-end gap-0.5">
              <span className="eq-bar h-4 w-0.5 bg-accent" />
              <span className="eq-bar h-4 w-0.5 bg-accent" />
              <span className="eq-bar h-4 w-0.5 bg-accent" />
            </span>
          ) : (
            <Play className="size-4 text-fg" fill="currentColor" />
          )}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.title}</p>
        <p className="truncate text-xs text-muted">
          {track.channel}
          <span className="mx-1.5 text-subtle">·</span>
          <span className="tabular-nums">{formatDuration(track.duration)}</span>
          {track.filesize ? (
            <>
              <span className="mx-1.5 text-subtle">·</span>
              <span className="tabular-nums">{formatBytes(track.filesize)}</span>
            </>
          ) : null}
        </p>
        {progress != null ? (
          <Progress value={Math.round(progress * 100)} className="mt-2" />
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="В сборку" onClick={onAdd}>
          <Plus className="size-4" />
        </Button>
        {onRemove ? (
          <Button variant="ghost" size="icon-sm" aria-label="Убрать" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        ) : null}
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label="Скачать"
          onClick={onDownload}
          disabled={progress != null}
        >
          {saved ? <Check className="size-4" /> : <Download className="size-4" />}
        </Button>
      </div>
    </li>
  );
}

function PlayerBar({
  track,
  playing,
  hasFile,
  format,
  quality,
  onToggle,
  onClose,
}: {
  track: Track;
  playing: boolean;
  hasFile: boolean;
  format: AudioFormat;
  quality: Mp3Quality;
  onToggle: () => void;
  onClose: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileUrl = hasFile ? getBlobUrl(track.id, format, quality) : undefined;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) void el.play().catch(() => undefined);
    else el.pause();
  }, [playing, fileUrl]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 py-3 pr-28 md:px-8 md:pr-36">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        {playing && !fileUrl ? (
          <div className="hidden overflow-hidden rounded-sm sm:block">
            <iframe
              title={track.title}
              src={`https://www.youtube-nocookie.com/embed/${track.id}?autoplay=1&rel=0&modestbranding=1`}
              allow="autoplay; encrypted-media"
              className="h-20 w-32 border-0"
            />
          </div>
        ) : (
          <img
            src={track.thumbnail}
            alt=""
            referrerPolicy="no-referrer"
            className="size-12 rounded-sm object-cover outline outline-1 -outline-offset-1 outline-fg/10"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{track.title}</p>
          <p className="truncate text-xs text-muted">{track.channel}</p>
        </div>
        {fileUrl ? (
          <audio ref={audioRef} className="hidden" src={fileUrl} preload="metadata" />
        ) : null}
        <Button
          variant="secondary"
          size="icon"
          aria-label={playing ? "Пауза" : "Играть"}
          onClick={onToggle}
        >
          {playing ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" fill="currentColor" />
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Закрыть
        </Button>
      </div>
      {playing && !fileUrl ? (
        <iframe
          title=""
          src={`https://www.youtube-nocookie.com/embed/${track.id}?autoplay=1&rel=0&modestbranding=1`}
          allow="autoplay; encrypted-media"
          className="mt-3 h-44 w-full rounded-md border-0 sm:hidden"
        />
      ) : null}
    </div>
  );
}
