// Supabase-backed mirror of historyDB.ts, used instead of IndexedDB once a
// user is signed in. Row Level Security (see supabase/schema.sql) scopes
// every query to auth.uid(), so `userId` here is only used to build rows to
// insert — reads/writes to another user's rows are rejected server-side
// regardless of what this client sends.
import type { HistoryItem } from "../types";
import { supabase } from "../supabase";

const TABLE = "history_items";

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

export async function getAllCloudHistory(): Promise<HistoryItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as HistoryRow[]).map(rowToItem);
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
