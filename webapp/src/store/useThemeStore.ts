import { create } from "zustand";

export type Theme = "light" | "dark";

const STORAGE_KEY = "ai-studio:theme";

function systemPrefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}

function readInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return systemPrefersDark() ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

// index.html already applies the initial class synchronously (before React
// mounts) to avoid a flash of the wrong theme; this store just keeps state
// and DOM in sync from here on.
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : readInitialTheme(),

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },

  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
