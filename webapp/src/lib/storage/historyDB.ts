import type { HistoryItem } from "../types";
import { openDB, withStore, STORES } from "./db";

const STORE = STORES.history;

export async function addHistoryItem(item: HistoryItem): Promise<void> {
  await withStore(STORE, "readwrite", (store) => store.put(item));
}

export async function updateHistoryItem(
  id: string,
  patch: Partial<HistoryItem>,
): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as HistoryItem | undefined;
      if (!existing) return resolve();
      const putReq = store.put({ ...existing, ...patch });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteHistoryItem(id: string): Promise<void> {
  await withStore(STORE, "readwrite", (store) => store.delete(id));
}

export async function getAllHistory(): Promise<HistoryItem[]> {
  const items = await withStore<HistoryItem[]>(STORE, "readonly", (store) => store.getAll());
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function clearHistory(): Promise<void> {
  await withStore(STORE, "readwrite", (store) => store.clear());
}

export async function exportHistoryJSON(): Promise<string> {
  const items = await getAllHistory();
  return JSON.stringify({ exportedAt: Date.now(), items }, null, 2);
}

export async function importHistoryJSON(json: string): Promise<number> {
  const parsed = JSON.parse(json);
  const items: HistoryItem[] = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(items)) throw new Error("导入文件格式不正确");
  for (const item of items) {
    await addHistoryItem(item);
  }
  return items.length;
}
