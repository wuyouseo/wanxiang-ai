import { create } from "zustand";
import { getActiveProvider } from "../lib/providers";
import { clearSettings, loadSettings, saveSettings } from "../lib/storage/localSettings";
import { DEFAULT_SETTINGS, type AppSettings, type KeyStatus } from "../lib/types";
import { toast } from "./useToastStore";

interface SettingsState {
  settings: AppSettings;
  hydrated: boolean;
  keyStatus: KeyStatus;
  testing: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  testConnection: () => Promise<void>;
  resetAll: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  keyStatus: "unconfigured",
  testing: false,

  hydrate: async () => {
    const settings = await loadSettings();
    set({
      settings,
      hydrated: true,
      keyStatus: settings.apiKey ? "unverified" : "unconfigured",
    });
  },

  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({
      settings: next,
      keyStatus:
        "apiKey" in patch ? (next.apiKey ? "unverified" : "unconfigured") : get().keyStatus,
    });
    await saveSettings(next);
  },

  testConnection: async () => {
    const { settings } = get();
    if (!settings.apiKey) {
      set({ keyStatus: "unconfigured" });
      toast.warning("请先输入 API Key");
      return;
    }
    set({ testing: true });
    const provider = getActiveProvider();
    const result = await provider.testConnection(settings);
    set({ testing: false, keyStatus: result.ok ? "verified" : "invalid" });
    if (result.ok) toast.success(result.message);
    else toast.danger(result.message);
  },

  resetAll: () => {
    clearSettings();
    set({ settings: DEFAULT_SETTINGS, keyStatus: "unconfigured" });
  },
}));
