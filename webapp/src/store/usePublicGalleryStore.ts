import { create } from "zustand";
import { deleteCloudHistoryItem, getPublicHistoryPage } from "../lib/storage/cloudHistoryDB";
import { deleteArtworkFromStorage } from "../lib/storage/artworkUpload";
import { ADMIN_EMAIL } from "../lib/constants";
import type { FeatureType, HistoryItem } from "../lib/types";
import { useAuthStore } from "./useAuthStore";
import { toast } from "./useToastStore";

// The public, cross-user gallery feed: every signed-in user's generated
// work, paginated (infinite scroll) newest-first. Unlike useHistoryStore
// ("个人作品" — always just your own), this shows everyone's, so there's no
// favorite toggle here (favoriting someone else's work doesn't mean
// anything) and delete is admin-only regardless of who made the item.

interface PublicGalleryState {
  items: HistoryItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  resultKind?: "image" | "video";
  type?: FeatureType;
  setFilters: (f: { resultKind?: "image" | "video"; type?: FeatureType }) => void;
  loadFirstPage: () => Promise<void>;
  loadMore: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const usePublicGalleryStore = create<PublicGalleryState>((set, get) => ({
  items: [],
  loading: false,
  loadingMore: false,
  hasMore: true,
  resultKind: undefined,
  type: undefined,

  setFilters: (f) => {
    set({ resultKind: f.resultKind, type: f.type });
    get().loadFirstPage();
  },

  loadFirstPage: async () => {
    set({ loading: true });
    try {
      const { resultKind, type } = get();
      const { items, hasMore } = await getPublicHistoryPage({ offset: 0, resultKind, type });
      set({ items, hasMore, loading: false });
    } catch {
      toast.danger("公开画廊加载失败，请检查网络后重试");
      set({ items: [], hasMore: false, loading: false });
    }
  },

  loadMore: async () => {
    const { loadingMore, hasMore, items, resultKind, type } = get();
    if (loadingMore || !hasMore) return;
    set({ loadingMore: true });
    try {
      const { items: next, hasMore: more } = await getPublicHistoryPage({
        offset: items.length,
        resultKind,
        type,
      });
      set({ items: [...items, ...next], hasMore: more, loadingMore: false });
    } catch {
      toast.danger("加载更多失败，请检查网络后重试");
      set({ loadingMore: false });
    }
  },

  remove: async (id) => {
    const user = useAuthStore.getState().user;
    // UI already hides the delete control for non-admin visitors; this is
    // the app-layer backstop — the database's delete policy (admin email
    // only, any row) is the real enforcement, see supabase/schema.sql.
    if (!user || user.email !== ADMIN_EMAIL) {
      toast.danger("仅管理员可以删除");
      return;
    }
    const item = get().items.find((i) => i.id === id);
    try {
      await deleteCloudHistoryItem(id);
    } catch {
      toast.danger("删除失败，请检查网络后重试");
      return;
    }
    if (item) deleteArtworkFromStorage(item.resultUrl).catch(() => {});
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },
}));
