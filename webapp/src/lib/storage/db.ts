// Shared IndexedDB handle for the app's two local stores: "history"
// (completed generations) and "tasks" (in-flight/completed video jobs —
// see storage/taskDB.ts). Centralized here because IndexedDB requires every
// open() call against the same database name to agree on one version and
// one upgrade path; splitting that across two independent modules is how
// you get silent version-mismatch bugs.

const DB_NAME = "ai-studio-db";
const DB_VERSION = 2;

export const STORES = {
  history: "history",
  tasks: "tasks",
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.history)) {
        const store = db.createObjectStore(STORES.history, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
        store.createIndex("type", "type");
      }
      if (!db.objectStoreNames.contains(STORES.tasks)) {
        const store = db.createObjectStore(STORES.tasks, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const req = fn(tx.objectStore(storeName));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
