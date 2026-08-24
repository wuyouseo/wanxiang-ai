import { decryptSecret, encryptSecret } from "../crypto";
import { DEFAULT_SETTINGS, type AppSettings } from "../types";

const SETTINGS_KEY = "ai-studio:settings";
const API_KEY_ENC_KEY = "ai-studio:api-key-enc";

type StoredSettings = Omit<AppSettings, "apiKey">;

export async function loadSettings(): Promise<AppSettings> {
  let stored: Partial<StoredSettings> = {};
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {
    // Corrupt/legacy blob — fall back to defaults rather than throwing on boot.
  }
  const encKey = localStorage.getItem(API_KEY_ENC_KEY) ?? "";
  const apiKey = await decryptSecret(encKey);
  return { ...DEFAULT_SETTINGS, ...stored, apiKey };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const { apiKey, ...rest } = settings;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
  const enc = await encryptSecret(apiKey);
  if (enc) {
    localStorage.setItem(API_KEY_ENC_KEY, enc);
  } else {
    localStorage.removeItem(API_KEY_ENC_KEY);
  }
}

export function clearSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(API_KEY_ENC_KEY);
}
