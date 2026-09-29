// Local-only obfuscation for the API key at rest in localStorage.
//
// This is NOT a security boundary against XSS on this origin (nothing
// client-side can be) — its purpose is to keep the raw key out of plain
// sight in devtools/localStorage dumps, backups, and accidental screenshots.
// The AES key itself lives in localStorage too, scoped to this browser
// profile; losing it (e.g. clearing site data) just means re-entering the key.

const DEVICE_KEY_STORAGE_KEY = "ai-studio:device-key";

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const existing = localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
  if (existing) {
    const raw = base64ToBytes(existing);
    return crypto.subtle.importKey("raw", raw as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]);
  }
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const raw = await crypto.subtle.exportKey("raw", key);
  localStorage.setItem(DEVICE_KEY_STORAGE_KEY, bytesToBase64(new Uint8Array(raw)));
  return key;
}

export async function encryptSecret(plaintext: string): Promise<string> {
  if (!plaintext) return "";
  const key = await getOrCreateDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded as BufferSource);
  const combined = new Uint8Array(iv.length + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), iv.length);
  return bytesToBase64(combined);
}

export async function decryptSecret(payload: string): Promise<string> {
  if (!payload) return "";
  try {
    const key = await getOrCreateDeviceKey();
    const combined = base64ToBytes(payload);
    const iv = combined.slice(0, 12);
    const cipher = combined.slice(12);
    const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, cipher as BufferSource);
    return new TextDecoder().decode(plainBuf);
  } catch {
    // Corrupt payload or device key rotated elsewhere — treat as "no key set"
    // rather than throwing, so a stale blob never bricks the settings page.
    return "";
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function maskSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 8) return "*".repeat(secret.length);
  return `${secret.slice(0, 4)}${"*".repeat(Math.max(4, secret.length - 8))}${secret.slice(-4)}`;
}
