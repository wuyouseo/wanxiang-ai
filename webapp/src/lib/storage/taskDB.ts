import type { VideoTask } from "../types";
import { openDB, withStore, STORES } from "./db";

const STORE = STORES.tasks;

export async function saveTask(task: VideoTask): Promise<void> {
  await withStore(STORE, "readwrite", (store) => store.put(task));
}

export async function patchTask(id: string, patch: Partial<VideoTask>): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as VideoTask | undefined;
      if (!existing) return resolve();
      const putReq = store.put({ ...existing, ...patch });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function renameTaskId(oldId: string, newId: string, patch: Partial<VideoTask>): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(oldId);
    getReq.onsuccess = () => {
      const existing = getReq.result as VideoTask | undefined;
      const next: VideoTask = existing ? { ...existing, ...patch, id: newId } : ({ ...patch, id: newId } as VideoTask);
      const delReq = store.delete(oldId);
      delReq.onsuccess = () => {
        const putReq = store.put(next);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      delReq.onerror = () => reject(delReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteTask(id: string): Promise<void> {
  await withStore(STORE, "readwrite", (store) => store.delete(id));
}

export async function getAllTasks(): Promise<VideoTask[]> {
  const items = await withStore<VideoTask[]>(STORE, "readonly", (store) => store.getAll());
  return items.sort((a, b) => b.createdAt - a.createdAt);
}
