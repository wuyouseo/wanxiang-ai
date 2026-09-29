// Downloads a generated image/video and re-uploads it into the user's own
// folder in the Supabase "artworks" bucket, returning a permanent public URL.
//
// Why this exists: Agnes returns a URL it hosts itself, and third-party
// generation URLs like that are commonly short-lived. Storing that URL
// directly in the database would mean "saved" artworks quietly 404 later —
// exactly the durability problem cloud sync is supposed to fix. So every
// artwork gets copied into storage we control at save time.
//
// Why the fetch goes through /api/agnes/relay-image instead of hitting the
// Agnes URL directly: a client-side fetch() needs the remote host to send
// CORS headers to read the response body, which Agnes doesn't document/
// guarantee (see lib/http.ts's proxy rationale). Routing through our own
// same-origin edge function sidesteps that entirely.
import { supabase } from "../supabase";

const RELAY_PREFIX = "/api/agnes/relay-image";
const BUCKET = "artworks";

async function fetchAsBlob(sourceUrl: string): Promise<Blob> {
  const res = await fetch(
    sourceUrl.startsWith("data:") ? sourceUrl : `${RELAY_PREFIX}?url=${encodeURIComponent(sourceUrl)}`,
  );
  if (!res.ok) throw new Error(`下载原始素材失败（HTTP ${res.status}）`);
  return res.blob();
}

function extensionFor(blob: Blob, kind: "image" | "video"): string {
  const type = blob.type;
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webm")) return "webm";
  if (type.includes("mp4")) return "mp4";
  return kind === "video" ? "mp4" : "png";
}

// Public Storage URLs look like
// https://<project>.supabase.co/storage/v1/object/public/artworks/<path>
// — this pulls <path> back out so a history-item delete can also remove the
// underlying file. Silently no-ops for anything else (e.g. an item whose
// upload failed and still points at Agnes's original URL) since there's no
// bucket object to clean up in that case.
function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

/** Best-effort — deletion is allowed to fail quietly (e.g. RLS rejects a non-admin caller). */
export async function deleteArtworkFromStorage(resultUrl: string): Promise<void> {
  const path = storagePathFromPublicUrl(resultUrl);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

/** Returns the new permanent Storage URL. Throws on any failure — caller decides the fallback. */
export async function persistArtworkToStorage(
  userId: string,
  itemId: string,
  sourceUrl: string,
  kind: "image" | "video",
): Promise<string> {
  const blob = await fetchAsBlob(sourceUrl);
  const path = `${userId}/${itemId}.${extensionFor(blob, kind)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || undefined,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
