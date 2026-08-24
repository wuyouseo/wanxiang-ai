import { create } from "zustand";

export type ToastKind = "success" | "warning" | "danger" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push("success", message),
  warning: (message: string) => useToastStore.getState().push("warning", message),
  danger: (message: string) => useToastStore.getState().push("danger", message),
  info: (message: string) => useToastStore.getState().push("info", message),
};
