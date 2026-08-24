import { create } from "zustand";
import type { HistoryItem } from "../lib/types";

// Tiny cross-component bridge for handoffs between pages that don't share a
// route: HistoryRail's "设为输入图" and Gallery's "复用参数" write here,
// workbench panels consume-and-clear via effect on mount. Keeps panels
// decoupled from the rail/gallery components that trigger the handoff.
interface TransferState {
  pendingImage: string | null;
  setPendingImage: (url: string | null) => void;
  pendingReuse: HistoryItem | null;
  setPendingReuse: (item: HistoryItem | null) => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  pendingImage: null,
  setPendingImage: (url) => set({ pendingImage: url }),
  pendingReuse: null,
  setPendingReuse: (item) => set({ pendingReuse: item }),
}));
