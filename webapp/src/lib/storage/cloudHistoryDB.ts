// Supabase-backed mirror of historyDB.ts, used instead of IndexedDB once a
// user is signed in — plus the public, cross-user gallery feed (see
// getPublicHistoryPage). Row Level Security (supabase/schema.sql) makes
// history_items publicly readable by design (it's a shared gallery), so
// unlike reads, `userId` filters here are load-bearing: nothing server-side
// restricts a "my own history" query to actually be your own — the client
// has to ask for that explicitly. Writes are still enforced server-side
// (insert/update require auth.uid() = user_id; delete requires the admin
// email), so a malicious client can't forge those regardless of what it sends.
import type { FeatureType, HistoryItem } from "../types";
import { supabase } from "../supabase";

const TABLE = "history_items";
const PUBLIC_PAGE_SIZE = 24;

interface HistoryRow {
  id: string;
  type: string;
  created_at: string;
  favorite: boolean;
  result_url: string;
  result_kind: string;
  params: unknown;
  prompt: string;
}

function rowToItem(row: HistoryRow): HistoryItem {
  return {
    id: row.id,
    type: row.type as HistoryItem["type"],
    createdAt: new Date(row.created_at).getTime(),
    favorite: row.favorite,
    resultUrl: row.result_url,
    resultKind: row.result_kind as HistoryItem["resultKind"],
    params: row.params as HistoryItem["params"],
    prompt: row.prompt,
  };
}

function itemToRow(userId: string, item: HistoryItem) {
  return {
    id: item.id,
    user_id: userId,
    type: item.type,
    created_at: new Date(item.createdAt).toISOString(),
    favorite: item.favorite,
    result_url: item.resultUrl,
    result_kind: item.resultKind,
    params: item.params,
    prompt: item.prompt,
  };
}

export async function getAllCloudHistory(userId: string): Promise<HistoryItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as HistoryRow[]).map(rowToItem);
}

export interface PublicHistoryPage {
  items: HistoryItem[];
  hasMore: boolean;
}

// The shared public gallery: every signed-in user's generated work, newest
// first, paginated for infinite scroll (see usePublicGalleryStore).
export async function getPublicHistoryPage(opts: {
  offset: number;
  limit?: number;
  resultKind?: "image" | "video";
  type?: FeatureType;
}): Promise<PublicHistoryPage> {
  const limit = opts.limit ?? PUBLIC_PAGE_SIZE;
  let query = supabase.from(TABLE).select("*").order("created_at", { ascending: false });
  if (opts.resultKind) query = query.eq("result_kind", opts.resultKind);
  if (opts.type) query = query.eq("type", opts.type);
  const { data, error } = await query.range(opts.offset, opts.offset + limit - 1);
  if (error) throw error;
  const items = (data as HistoryRow[]).map(rowToItem);
  return { items, hasMore: items.length === limit };
}

// Upsert (not insert) so re-adding the same id — e.g. a retried "sync local
// history to cloud" pass — never fails on a duplicate-key conflict.
export async function addCloudHistoryItem(userId: string, item: HistoryItem): Promise<void> {
  const { error } = await supabase.from(TABLE).upsert(itemToRow(userId, item));
  if (error) throw error;
}

export async function updateCloudHistoryItem(id: string, patch: Partial<HistoryItem>): Promise<void> {
  const row: Record<string, unknown> = {};
  if ("favorite" in patch) row.favorite = patch.favorite;
  if ("resultUrl" in patch) row.result_url = patch.resultUrl;
  const { error } = await supabase.from(TABLE).update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteCloudHistoryItem(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function clearCloudHistory(userId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("user_id", userId);
  if (error) throw error;
}
