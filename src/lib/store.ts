import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AudioFormat,
  LocalPlaylist,
  Mp3Quality,
  ResolveResult,
  TitleLang,
  Track,
} from "./media";
import { DEFAULT_MP3_QUALITY, DEFAULT_TITLE_LANG, newId } from "./media";

type Catalog = Record<string, Track>;

type AppState = {
  format: AudioFormat;
  mp3Quality: Mp3Quality;
  titleLang: TitleLang;
  catalog: Catalog;
  historyIds: string[];
  playlists: LocalPlaylist[];
  selectedIds: string[];
  inbox: ResolveResult | null;
  setFormat: (format: AudioFormat) => void;
  setMp3Quality: (quality: Mp3Quality) => void;
  setTitleLang: (lang: TitleLang) => void;
  setInbox: (inbox: ResolveResult | null) => void;
  remember: (tracks: Track[]) => void;
  putCatalog: (tracks: Track[]) => void;
  toggleSelected: (id: string) => void;
  setSelected: (ids: string[]) => void;
  clearSelected: () => void;
  createPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, trackIds: string[]) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  importShared: (name: string, tracks: Track[]) => string;
  clearHistory: () => void;
};

const MAX_HISTORY = 80;

export const useLibrary = create<AppState>()(
  persist(
    (set, get) => ({
      format: "m4a",
      mp3Quality: DEFAULT_MP3_QUALITY,
      titleLang: DEFAULT_TITLE_LANG,
      catalog: {},
      historyIds: [],
      playlists: [],
      selectedIds: [],
      inbox: null,
      setFormat: (format) => set({ format }),
      setMp3Quality: (mp3Quality) => set({ mp3Quality }),
      setTitleLang: (titleLang) => set({ titleLang }),
      setInbox: (inbox) => set({ inbox }),
      remember: (tracks) => {
        if (tracks.length === 0) return;
        const catalog = { ...get().catalog };
        for (const track of tracks) catalog[track.id] = track;
        const incoming = tracks.map((t) => t.id);
        const historyIds = [
          ...incoming,
          ...get().historyIds.filter((id) => !incoming.includes(id)),
        ].slice(0, MAX_HISTORY);
        set({ catalog, historyIds });
      },
      putCatalog: (tracks) => {
        if (tracks.length === 0) return;
        const catalog = { ...get().catalog };
        let changed = false;
        for (const track of tracks) {
          const prev = catalog[track.id];
          if (!prev) {
            catalog[track.id] = track;
            changed = true;
            continue;
          }
          const next = {
            ...prev,
            title: prev.title && prev.title !== prev.id ? prev.title : track.title || prev.title,
            channel: prev.channel || track.channel,
            duration: prev.duration ?? track.duration,
            thumbnail: prev.thumbnail || track.thumbnail,
            url: prev.url || track.url,
            filesize: track.filesize ?? prev.filesize,
          };
          if (
            next.title !== prev.title ||
            next.channel !== prev.channel ||
            next.duration !== prev.duration ||
            next.thumbnail !== prev.thumbnail ||
            next.filesize !== prev.filesize
          ) {
            catalog[track.id] = next;
            changed = true;
          }
        }
        if (changed) set({ catalog });
      },
      toggleSelected: (id) => {
        const selectedIds = get().selectedIds;
        set({
          selectedIds: selectedIds.includes(id)
            ? selectedIds.filter((x) => x !== id)
            : [...selectedIds, id],
        });
      },
      setSelected: (ids) => set({ selectedIds: [...new Set(ids)] }),
      clearSelected: () => set({ selectedIds: [] }),
      createPlaylist: (name) => {
        const id = newId("pl");
        const playlist: LocalPlaylist = {
          id,
          name: name.trim() || "Без названия",
          trackIds: [],
          createdAt: Date.now(),
        };
        set({ playlists: [playlist, ...get().playlists] });
        return id;
      },
      renamePlaylist: (id, name) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === id ? { ...p, name: name.trim() || p.name } : p,
          ),
        }),
      deletePlaylist: (id) =>
        set({ playlists: get().playlists.filter((p) => p.id !== id) }),
      addToPlaylist: (playlistId, trackIds) =>
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const merged = [...p.trackIds];
            for (const id of trackIds) {
              if (!merged.includes(id)) merged.push(id);
            }
            return { ...p, trackIds: merged };
          }),
        }),
      removeFromPlaylist: (playlistId, trackId) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId
              ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) }
              : p,
          ),
        }),
      importShared: (name, tracks) => {
        get().remember(tracks);
        const incoming = tracks.map((t) => t.id);
        const title = name.trim() || "Подборка";
        const existing = get().playlists.find(
          (p) => p.name === title && p.trackIds.join() === incoming.join(),
        );
        if (existing) return existing.id;
        const id = newId("pl");
        const playlist: LocalPlaylist = {
          id,
          name: title,
          trackIds: incoming,
          createdAt: Date.now(),
        };
        set({ playlists: [playlist, ...get().playlists] });
        return id;
      },
      clearHistory: () => set({ historyIds: [] }),
    }),
    {
      name: "octava-library",
      skipHydration: true,
      partialize: (state) => ({
        format: state.format,
        mp3Quality: state.mp3Quality,
        titleLang: state.titleLang,
        catalog: state.catalog,
        historyIds: state.historyIds,
        playlists: state.playlists,
        inbox: state.inbox,
      }),
    },
  ),
);
