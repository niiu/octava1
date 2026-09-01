import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Archive,
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
import { getBlob, getBlobUrl, hasBlob } from "@/lib/blobs";
import { DownloadError, ensureServerJob } from "@/lib/download-client";
import { cancelJob, fetchJobFile, jobDownloadUrl, listJobs, startBrowserDownload, startJob, waitForJob, zipDownloadUrl } from "@/lib/jobs-client";
import { getExtractorCaps, resolveMedia } from "@/lib/media.functions";
import { cookiePayload, loadStoredCookies } from "@/lib/cookies-client";
import { countCookieRows } from "@/lib/cookie-file";
import { ingestYtText, noteYt, resetYtDownloadRatio } from "@/lib/yt-log-client";
import type { AudioFormat, DownloadJob, ExtractorCaps, Mp3Quality, Track } from "@/lib/media";
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
import { saveBlob } from "@/lib/pack-zip";
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
  const [serverJobs, setServerJobs] = useState<DownloadJob[]>([]);

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
  const result = useLibrary((s) => s.inbox);
  const setInbox = useLibrary((s) => s.setInbox);

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

  const runningJobs = serverJobs.filter(
    (j) => j.status === "queued" || j.status === "running",
  );
  const jobsBusy = runningJobs.length > 0;

  function doneJobFor(track: Track): DownloadJob | undefined {
    return serverJobs.find(
      (j) =>
        j.videoId === track.id &&
        j.format === format &&
        (format !== "mp3" || j.quality === mp3Quality) &&
        j.status === "done",
    );
  }

  function fileReady(track: Track): boolean {
    return Boolean(
      ready[blobKey(track.id, format, mp3Quality)] ||
        hasBlob(track.id, format, mp3Quality) ||
        doneJobFor(track),
    );
  }

  useEffect(() => {
    let alive = true;
    const seenDone = new Set<string>();
    async function tick() {
      try {
        const jobs = await listJobs();
        if (!alive) return;
        setServerJobs(jobs);
        setReady((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const job of jobs) {
            if (job.status !== "done") continue;
            const key = blobKey(job.videoId, job.format, job.quality);
            if (!next[key]) {
              next[key] = true;
              changed = true;
            }
            if (!seenDone.has(job.jobId) && job.progress >= 1) {
              seenDone.add(job.jobId);
            }
          }
          return changed ? next : prev;
        });
        setProgress((prev) => {
          const next = { ...prev };
          let changed = false;
          const live = new Set<string>();
          for (const job of jobs) {
            if (job.status === "queued" || job.status === "running") {
              live.add(job.videoId);
              const ratio = Math.max(0.03, job.progress);
              if (next[job.videoId] !== ratio) {
                next[job.videoId] = ratio;
                changed = true;
              }
            }
          }
          for (const id of Object.keys(next)) {
            if (!live.has(id)) {
              delete next[id];
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      } catch {
        /* keep last snapshot */
      }
    }
    void tick();
    const ms = jobsBusy ? 400 : 4_000;
    const id = window.setInterval(() => void tick(), ms);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [jobsBusy]);

  const activeJob =
    runningJobs.find((j) => j.status === "running") ?? runningJobs[0] ?? null;
  const liveRatio = Math.max(
    0.03,
    activeJob?.progress ?? 0,
    activeJob ? progress[activeJob.videoId] ?? 0 : 0,
    fetchingId ? progress[fetchingId] ?? 0 : 0,
  );

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
      setInbox(next);
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
      const job = await ensureServerJob(
        track.id,
        format,
        (ratio) => {
          setProgress((p) => ({ ...p, [track.id]: ratio }));
        },
        cookiePayload(cookies),
        mp3Quality,
        undefined,
        track.title,
        track.duration,
      );
      if (job.status !== "done") {
        throw new DownloadError("JOB", job.error || "Не удалось скачать");
      }
      setReady((r) => ({ ...r, [blobKey(track.id, format, mp3Quality)]: true }));
      noteYt("ok", `на сервере «${track.title}»`);
      toast.success("Файл на сервере. Если браузер не скачал — зелёная «На устройство»", {
        duration: 14_000,
        action: {
          label: "На устройство",
          onClick: () => saveTrackToDevice(track),
        },
      });
      void fetchJobFile(job, mp3Quality)
        .then((blob) => {
          const filename = `${safeFilename(track.title)}.${extensionFor(format, blob.type)}`;
          saveBlob(blob, filename);
        })
        .catch(() => {
          noteYt("warn", `браузер не забрал файл — зелёная «На устройство»`);
        });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка загрузки";
      noteYt("error", `${track.title}: ${message}`);
      if (err instanceof DownloadError) ingestYtText(err.log, "error");
      toast.error(message);
    } finally {
      setFetchingId(null);
      setProgress((p) => {
        if (!(track.id in p)) return p;
        const next = { ...p };
        delete next[track.id];
        return next;
      });
    }
  }

  function saveTrackToDevice(track: Track) {
    const cached = getBlob(track.id, format, mp3Quality);
    if (cached && cached.size >= 4_096) {
      const filename = `${safeFilename(track.title)}.${extensionFor(format, cached.type)}`;
      saveBlob(cached, filename);
      noteYt("ok", `на устройство «${track.title}»`);
      return;
    }
    const done = doneJobFor(track);
    if (done) {
      const filename =
        done.filename || `${safeFilename(track.title)}.${extensionFor(format, done.mime)}`;
      startBrowserDownload(jobDownloadUrl(done.jobId), filename);
      noteYt("ok", `на устройство «${track.title}»`);
      return;
    }
    void downloadOne(track);
  }

  function cancelActiveJob() {
    zipAbort.current?.abort();
    for (const job of runningJobs) void cancelJob(job.jobId);
    setFetchingId(null);
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
      current: tracks[0]?.title ?? "",
      done: 0,
      total: tracks.length,
      packing: false,
      skipped: 0,
    });

    const doneIds: string[] = [];
    let skipped = 0;
    let cancelled = false;
    const ck = cookiePayload(cookies);

    try {
      const pending: Array<{ track: Track; jobId: string }> = [];
      for (const track of tracks) {
        if (ac.signal.aborted) {
          cancelled = true;
          break;
        }
        if (fileReady(track)) {
          const existing = doneJobFor(track);
          if (existing) doneIds.push(existing.jobId);
          continue;
        }
        try {
          const job = await startJob({
            videoId: track.id,
            title: track.title,
            format,
            quality: mp3Quality,
            cookies: ck,
            duration: track.duration,
          });
          if (job.status === "done") {
            doneIds.push(job.jobId);
            setReady((r) => ({ ...r, [blobKey(track.id, format, mp3Quality)]: true }));
          } else if (job.status === "error") {
            throw new DownloadError("JOB", job.error || "не скачался");
          } else {
            pending.push({ track, jobId: job.jobId });
          }
        } catch (err) {
          skipped += 1;
          const message = err instanceof Error ? err.message : "не скачался";
          noteYt("error", `${track.title}: ${message}`);
          noteYt("warn", `пропуск «${track.title}», следующий`);
          setZip((z) => ({ ...z, skipped: z.skipped + 1 }));
        }
      }

      noteYt("info", `очередь: ${pending.length} файл(ов) по одному`);
      for (let i = 0; i < pending.length; i++) {
        if (ac.signal.aborted) {
          cancelled = true;
          break;
        }
        const { track, jobId } = pending[i]!;
        noteYt("info", `${i + 1}/${pending.length} · «${track.title}»`);
        setFetchingId(track.id);
        resetYtDownloadRatio();
        setProgress((p) => ({ ...p, [track.id]: 0.03 }));
        setZip((z) => ({
          ...z,
          current: track.title,
          packing: false,
          done: doneIds.length,
        }));
        try {
          const job = await waitForJob(
            jobId,
            (ratio) => {
              setProgress((p) => ({ ...p, [track.id]: ratio }));
            },
            ac.signal,
          );
          if (job.status !== "done") {
            throw new DownloadError("JOB", job.error || "не скачался");
          }
          doneIds.push(job.jobId);
          setReady((r) => ({ ...r, [blobKey(track.id, format, mp3Quality)]: true }));
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
          if (!cancelled) setZip((z) => ({ ...z, done: doneIds.length }));
          setProgress((p) => {
            const next = { ...p };
            delete next[track.id];
            return next;
          });
        }
      }
    } catch (err) {
      if (isAbortError(err) || ac.signal.aborted) cancelled = true;
      else toast.error(err instanceof Error ? err.message : "Не удалось собрать ZIP");
    }

    setFetchingId(null);
    if (cancelled || ac.signal.aborted) {
      zipAbort.current = null;
      toast.message("Отменено");
      setZip(ZIP_IDLE);
      return;
    }

    if (doneIds.length === 0) {
      zipAbort.current = null;
      toast.error(
        skipped > 0
          ? `Не удалось скачать выбранные треки (${skipped})`
          : "В архив не попало ни одного файла",
      );
      setZip(ZIP_IDLE);
      return;
    }

    setZip((z) => ({ ...z, packing: true, current: "Упаковка ZIP", done: doneIds.length }));
    const stamp = new Date().toISOString().slice(0, 10);
    const name = result?.kind === "playlist" ? safeFilename(result.title) : "octava";
    const zipName = `${name}-${stamp}.zip`;
    const url = zipDownloadUrl(doneIds, `${name}-${stamp}`);
    startBrowserDownload(url, zipName);
    noteYt("ok", `ZIP ${doneIds.length} файл(ов)`);
    toast.success(
      skipped > 0
        ? `ZIP: ${doneIds.length} файл(ов), пропуск ${skipped}`
        : `ZIP: ${doneIds.length} файл(ов)`,
      {
        duration: 16_000,
        action: {
          label: "На устройство",
          onClick: () => startBrowserDownload(url, zipName),
        },
      },
    );
    zipAbort.current = null;
    setZip(ZIP_IDLE);
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
            <YtConsole busy={busy || zip.open || Boolean(fetchingId) || jobsBusy} />
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
                ffmpeg={caps?.ffmpeg !== false}
                onChange={(next) => {
                  if (next === "mp3" && caps && !caps.ffmpeg) {
                    toast.message("Для MP3 нужен ffmpeg — откройте «Установка»");
                    return;
                  }
                  setFormat(next);
                }}
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

          {zip.open || fetchingId || jobsBusy ? (
            <div
              id="octava-job"
              className="mt-4 rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {zip.open
                      ? zip.packing
                        ? "Собираем архив"
                        : "Качаем треки"
                      : "Качаем на сервере"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {zip.open
                      ? zip.current || "…"
                      : runningJobs[0]?.title ||
                        visibleTracks.find((t) => t.id === fetchingId)?.title ||
                        "…"}
                  </p>
                  <p className="mt-1 text-xs text-subtle">
                    Можно закрыть вкладку — задание продолжит качаться.
                  </p>
                </div>
                <Button
                  id="octava-job-cancel"
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={cancelActiveJob}
                >
                  Отмена
                </Button>
              </div>
              <Progress
                id="octava-zip-progress"
                className="mt-3 h-2.5"
                value={
                  zip.open
                    ? !zip.total
                      ? 3
                      : zip.packing || (!fetchingId && zip.done >= zip.total)
                        ? 100
                        : Math.min(
                            99,
                            Math.round(
                              ((zip.done + (fetchingId ? liveRatio * 0.97 : 0)) /
                                zip.total) *
                                100,
                            ),
                          )
                    : Math.min(99, Math.round(liveRatio * 100))
                }
              />
              <p className="mt-2 font-mono text-xs tabular-nums text-muted">
                {zip.open ? (
                  <>
                    {zip.done} / {zip.total}
                    {zip.skipped > 0 ? ` · пропуск ${zip.skipped}` : ""}
                    {!zip.packing && fetchingId
                      ? ` · ${Math.round(liveRatio * 100)}%`
                      : ""}
                  </>
                ) : (
                  <>
                    {Math.round(liveRatio * 100)}%
                    {runningJobs.length > 1
                      ? ` · ещё ${runningJobs.filter((j) => j.status === "queued").length} в очереди`
                      : ""}
                  </>
                )}
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
                    (fetchingId === track.id ||
                      runningJobs.some((j) => j.videoId === track.id)) &&
                    !fileReady(track)
                      ? Math.max(
                          0.03,
                          progress[track.id] ?? 0,
                          runningJobs.find((j) => j.videoId === track.id)?.progress ?? 0,
                        )
                      : undefined
                  }
                  saved={fileReady(track)}
                  isPlaying={nowPlaying?.id === track.id && playing}
                  onPlay={() => playTrack(track)}
                  onDownload={() => void downloadOne(track)}
                  onSave={() => saveTrackToDevice(track)}
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
          hasFile={fileReady(nowPlaying)}
          format={format}
          quality={mp3Quality}
          onToggle={() => setPlaying((v) => !v)}
          onSave={() => saveTrackToDevice(nowPlaying)}
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
  const options: AudioFormat[] = ["m4a", "mp3", "source"];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md bg-raised p-1 shadow-[var(--shadow-border)]">
        {options.map((opt) => (
          <button
            key={opt}
            id={`octava-format-${opt}`}
            type="button"
            onClick={() => onChange(opt)}
            disabled={opt === "mp3" && !ffmpeg}
            className={cn(
              "h-8 rounded-sm px-2.5 text-xs font-medium",
              value === opt ? "bg-fg text-bg" : "text-muted hover:text-fg",
            )}
          >
            {FORMAT_LABEL[opt]}
          </button>
        ))}
      </div>
      {value === "mp3" ? (
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
  onSave,
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
  onSave: () => void;
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
          <>
            <Progress value={Math.round(progress * 100)} className="mt-2 h-2.5" />
            <p className="mt-1 font-mono text-xs tabular-nums text-muted">
              {Math.round(progress * 100)}%
            </p>
          </>
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
        {saved && progress == null ? (
          <Button
            variant="sage"
            size="sm"
            aria-label="На устройство"
            onClick={onSave}
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">На устройство</span>
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="icon-sm"
            aria-label="Скачать"
            onClick={onDownload}
            disabled={progress != null}
          >
            {progress != null ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
          </Button>
        )}
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
  onSave,
  onClose,
}: {
  track: Track;
  playing: boolean;
  hasFile: boolean;
  format: AudioFormat;
  quality: Mp3Quality;
  onToggle: () => void;
  onSave: () => void;
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
        {hasFile ? (
          <Button variant="sage" size="sm" onClick={onSave} aria-label="На устройство">
            <Download className="size-4" />
            <span className="hidden sm:inline">На устройство</span>
          </Button>
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
