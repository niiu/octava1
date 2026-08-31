import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AudioFormat, LocalPlaylist, Mp3Quality, Track } from "./media";
import { DEFAULT_MP3_QUALITY, newId } from "./media";

type Catalog = Record<string, Track>;

type AppState = {
  format: AudioFormat;
  mp3Quality: Mp3Quality;
  catalog: Catalog;
  historyIds: string[];
  playlists: LocalPlaylist[];
  selectedIds: string[];
  setFormat: (format: AudioFormat) => void;
  setMp3Quality: (quality: Mp3Quality) => void;
  remember: (tracks: Track[]) => void;
  toggleSelected: (id: string) => void;
  setSelected: (ids: string[]) => void;
  clearSelected: () => void;
  createPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, trackIds: string[]) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  clearHistory: () => void;
};

const MAX_HISTORY = 80;

export const useLibrary = create<AppState>()(
  persist(
    (set, get) => ({
      format: "m4a",
      mp3Quality: DEFAULT_MP3_QUALITY,
      catalog: {},
      historyIds: [],
      playlists: [],
      selectedIds: [],
      setFormat: (format) => set({ format }),
      setMp3Quality: (mp3Quality) => set({ mp3Quality }),
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
      clearHistory: () => set({ historyIds: [] }),
    }),
    {
      name: "octava-library",
      skipHydration: true,
      partialize: (state) => ({
        format: state.format,
        mp3Quality: state.mp3Quality,
        catalog: state.catalog,
        historyIds: state.historyIds,
        playlists: state.playlists,
      }),
    },
  ),
);
