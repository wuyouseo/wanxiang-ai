import { create } from "zustand";
import {
  addHistoryItem,
  clearHistory,
  deleteHistoryItem,
  exportHistoryJSON as exportLocalHistoryJSON,
  getAllHistory,
  updateHistoryItem,
} from "../lib/storage/historyDB";
import {
  addCloudHistoryItem,
  clearCloudHistory,
  deleteCloudHistoryItem,
  getAllCloudHistory,
  updateCloudHistoryItem,
} from "../lib/storage/cloudHistoryDB";
import { deleteArtworkFromStorage, persistArtworkToStorage } from "../lib/storage/artworkUpload";
import { ADMIN_EMAIL } from "../lib/constants";
import type { HistoryItem } from "../lib/types";
import { useAuthStore } from "./useAuthStore";
import { toast } from "./useToastStore";

// This is the "个人作品" (personal works) backend — always scoped to just
// the current user, never anyone else's. Signed-out users work entirely off
// the browser's IndexedDB (unchanged from before cloud sync existed); once
// useAuthStore has a user, every action here reads/writes that user's own
// rows in Supabase instead, so history survives switching devices/browsers.
// Every consumer (GalleryPage's "个人作品" tab, HistoryRail, the workbench
// panels) only ever touches this store's public shape, so none of them need
// to know which backend is active. The public, cross-user gallery feed is a
// separate store — see usePublicGalleryStore.ts.

interface HistoryState {
  items: HistoryItem[];
  loaded: boolean;
  syncing: boolean;
  refresh: () => Promise<void>;
  add: (item: HistoryItem) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  exportJSON: () => Promise<string>;
  importJSON: (json: string) => Promise<void>;
  syncLocalToCloud: () => Promise<void>;
  recentByType: (type: HistoryItem["type"], limit?: number) => HistoryItem[];
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  loaded: false,
  syncing: false,

  refresh: async () => {
    const user = useAuthStore.getState().user;
    try {
      const items = user ? await getAllCloudHistory(user.id) : await getAllHistory();
      set({ items, loaded: true });
    } catch {
      toast.danger("云端历史加载失败，请检查网络后重试");
      set({ items: [], loaded: true });
    }
  },

  add: async (item) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      await addHistoryItem(item);
      set((s) => ({ items: [item, ...s.items] }));
      return;
    }

    let toSave = item;
    try {
      const permanentUrl = await persistArtworkToStorage(user.id, item.id, item.resultUrl, item.resultKind);
      toSave = { ...item, resultUrl: permanentUrl };
    } catch {
      toast.warning("素材转存云端存储失败，已按原始链接保存（该链接可能会过期）");
    }

    try {
      await addCloudHistoryItem(user.id, toSave);
      set((s) => ({ items: [toSave, ...s.items] }));
    } catch {
      toast.danger("保存到云端失败，请检查网络后重试");
    }
  },

  toggleFavorite: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const favorite = !item.favorite;
    const user = useAuthStore.getState().user;
    if (user) {
      await updateCloudHistoryItem(id, { favorite }).catch(() => toast.danger("更新收藏状态失败"));
    } else {
      await updateHistoryItem(id, { favorite });
    }
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, favorite } : i)) }));
  },

  remove: async (id) => {
    const user = useAuthStore.getState().user;
    // UI already hides the delete control for non-admin cloud users; this is
    // the app-layer backstop (the database's delete policy is the real
    // enforcement — see supabase/schema.sql).
    if (user && user.email !== ADMIN_EMAIL) {
      toast.danger("仅管理员可以删除云端历史");
      return;
    }
    if (user) {
      const item = get().items.find((i) => i.id === id);
      try {
        await deleteCloudHistoryItem(id);
      } catch {
        toast.danger("删除失败，请检查网络后重试");
        return;
      }
      if (item) deleteArtworkFromStorage(item.resultUrl).catch(() => {});
    } else {
      await deleteHistoryItem(id);
    }
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  clearAll: async () => {
    const user = useAuthStore.getState().user;
    if (user && user.email !== ADMIN_EMAIL) {
      toast.danger("仅管理员可以清空云端历史");
      return;
    }
    const itemsBeforeClear = get().items;
    try {
      if (user) {
        await clearCloudHistory(user.id);
      } else {
        await clearHistory();
      }
    } catch {
      toast.danger("清空云端历史失败，请检查网络后重试");
      return;
    }
    if (user) {
      for (const item of itemsBeforeClear) {
        deleteArtworkFromStorage(item.resultUrl).catch(() => {});
      }
    }
    set({ items: [] });
    toast.info("已清空全部历史记录");
  },

  exportJSON: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return exportLocalHistoryJSON();
    return JSON.stringify({ exportedAt: Date.now(), items: get().items }, null, 2);
  },

  importJSON: async (json) => {
    const parsed = JSON.parse(json);
    const items: HistoryItem[] = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(items)) throw new Error("导入文件格式不正确");
    for (const item of items) {
      await get().add(item);
    }
    toast.success(`成功导入 ${items.length} 条历史记录`);
  },

  // "One-click" migration for a user who just logged in for the first time
  // and has pre-existing guest history sitting in this browser's IndexedDB.
  // Re-uses `add()` per item (upsert-based) so running it twice is harmless.
  syncLocalToCloud: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ syncing: true });
    try {
      const localItems = await getAllHistory();
      if (localItems.length === 0) {
        toast.info("本地没有可同步的历史记录");
        return;
      }
      let success = 0;
      for (const item of localItems) {
        try {
          await get().add(item);
          success++;
        } catch {
          // add() already surfaces a toast per-item failure; keep going.
        }
      }
      toast.success(`已同步 ${success}/${localItems.length} 条本地记录到云端`);
    } finally {
      set({ syncing: false });
    }
  },

  recentByType: (type, limit = 4) => {
    return get()
      .items.filter((i) => i.type === type)
      .slice(0, limit);
  },
}));
