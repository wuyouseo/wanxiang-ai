import { create } from "zustand";
import {
  addHistoryItem,
  clearHistory,
  deleteHistoryItem,
  exportHistoryJSON,
  getAllHistory,
  importHistoryJSON,
  updateHistoryItem,
} from "../lib/storage/historyDB";
import type { HistoryItem } from "../lib/types";
import { toast } from "./useToastStore";

interface HistoryState {
  items: HistoryItem[];
  loaded: boolean;
  refresh: () => Promise<void>;
  add: (item: HistoryItem) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  exportJSON: () => Promise<string>;
  importJSON: (json: string) => Promise<void>;
  recentByType: (type: HistoryItem["type"], limit?: number) => HistoryItem[];
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  loaded: false,

  refresh: async () => {
    const items = await getAllHistory();
    set({ items, loaded: true });
  },

  add: async (item) => {
    await addHistoryItem(item);
    set((s) => ({ items: [item, ...s.items] }));
  },

  toggleFavorite: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const favorite = !item.favorite;
    await updateHistoryItem(id, { favorite });
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, favorite } : i)) }));
  },

  remove: async (id) => {
    await deleteHistoryItem(id);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  clearAll: async () => {
    await clearHistory();
    set({ items: [] });
    toast.info("已清空全部历史记录");
  },

  exportJSON: async () => exportHistoryJSON(),

  importJSON: async (json) => {
    const count = await importHistoryJSON(json);
    await get().refresh();
    toast.success(`成功导入 ${count} 条历史记录`);
  },

  recentByType: (type, limit = 4) => {
    return get()
      .items.filter((i) => i.type === type)
      .slice(0, limit);
  },
}));
