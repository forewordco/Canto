/* ═══════════════════════════════════════════════════════════
   OFFLINE QUEUE & SYNC — IndexedDB-backed mutation queue.

   When the browser goes offline, mutations (dirty data saves)
   are queued in IndexedDB. When connectivity resumes, the
   queue is replayed in order. An exponential backoff is used
   for replay failures.

   Phase 3 P3-4 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Constants ─── */

const DB_NAME = "flowos-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "mutations";
const MAX_REPLAY_RETRIES = 5;
const REPLAY_BASE_DELAY = 1000;

/* ─── IndexedDB Helpers ─── */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface QueuedMutation {
  id?: number;
  timestamp: number;
  payload: Record<string, unknown>;
}

/** Enqueue a mutation payload into IndexedDB */
export async function enqueueMutation(payload: Record<string, unknown>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add({ timestamp: Date.now(), payload });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    console.log("[Offline] Mutation queued in IndexedDB");
  } catch (err) {
    console.warn("[Offline] Failed to queue mutation, falling back to localStorage:", err);
    // Fallback to localStorage if IndexedDB is unavailable
    try {
      const existing = JSON.parse(localStorage.getItem("flowos-offline-queue") || "[]");
      existing.push({ timestamp: Date.now(), payload });
      localStorage.setItem("flowos-offline-queue", JSON.stringify(existing));
    } catch {
      console.error("[Offline] localStorage fallback also failed");
    }
  }
}

/** Read all queued mutations from IndexedDB */
export async function readQueue(): Promise<QueuedMutation[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    const items = await new Promise<QueuedMutation[]>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return items;
  } catch {
    // Fallback: read from localStorage
    try {
      const items = JSON.parse(localStorage.getItem("flowos-offline-queue") || "[]");
      return items;
    } catch {
      return [];
    }
  }
}

/** Clear all mutations from the queue */
export async function clearQueue(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // noop
  }
  // Also clear localStorage fallback
  try {
    localStorage.removeItem("flowos-offline-queue");
  } catch {
    // noop
  }
}

/** Remove a single mutation by id */
export async function dequeueMutation(id: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // noop
  }
}

/** Get the number of queued mutations */
export async function getQueueSize(): Promise<number> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();
    const count = await new Promise<number>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return count;
  } catch {
    try {
      const items = JSON.parse(localStorage.getItem("flowos-offline-queue") || "[]");
      return items.length;
    } catch {
      return 0;
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   ONLINE / OFFLINE DETECTION HOOK
   ═══════════════════════════════════════════════════════════ */

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      console.log("[Offline] Browser is back online");
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log("[Offline] Browser went offline");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/* ═══════════════════════════════════════════════════════════
   OFFLINE SYNC MANAGER — Replays queued mutations on reconnect
   ═══════════════════════════════════════════════════════════ */

export interface OfflineSyncManager {
  isOnline: boolean;
  queueSize: number;
  isSyncing: boolean;
  lastSyncError: string | null;
  /** Force replay the queue now */
  replayNow: () => Promise<void>;
  /** Enqueue a save payload when offline */
  enqueue: (payload: Record<string, unknown>) => Promise<void>;
}

/**
 * Hook that manages offline queue and automatic replay.
 * @param saveFn - The function to call for each queued mutation (e.g., batch-save API call)
 */
export function useOfflineSync(
  saveFn: (payload: Record<string, unknown>) => Promise<{ error: string | null }>
): OfflineSyncManager {
  const isOnline = useOnlineStatus();
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const syncingRef = useRef(false);
  const retryCountRef = useRef(0);

  // Poll queue size
  const refreshQueueSize = useCallback(async () => {
    const size = await getQueueSize();
    setQueueSize(size);
  }, []);

  useEffect(() => {
    refreshQueueSize();
  }, [refreshQueueSize]);

  // Replay function
  const replayNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    setLastSyncError(null);

    try {
      const mutations = await readQueue();
      if (mutations.length === 0) {
        syncingRef.current = false;
        setIsSyncing(false);
        setQueueSize(0);
        return;
      }

      console.log(`[Offline] Replaying ${mutations.length} queued mutations...`);

      // Merge all mutations into a single batch payload for efficiency
      const mergedPayload: Record<string, unknown> = {};
      for (const mut of mutations) {
        const p = mut.payload;
        // Merge projects
        if (p.projects) {
          mergedPayload.projects = {
            ...(mergedPayload.projects as Record<string, unknown> || {}),
            ...(p.projects as Record<string, unknown>),
          };
        }
        // Merge deleted projects
        if (p.deletedProjects) {
          const existing = (mergedPayload.deletedProjects as string[]) || [];
          mergedPayload.deletedProjects = [...existing, ...(p.deletedProjects as string[])];
        }
        // For scalar fields, last-write-wins
        for (const key of ["clients", "events", "docs", "starred", "todayTasks", "timeBlocks", "weekSettings", "notifications", "teamMembers", "profile"]) {
          if (p[key] !== undefined) {
            mergedPayload[key] = p[key];
          }
        }
      }

      const { error } = await saveFn(mergedPayload);

      if (error) {
        retryCountRef.current++;
        if (retryCountRef.current >= MAX_REPLAY_RETRIES) {
          setLastSyncError(`Sync failed after ${MAX_REPLAY_RETRIES} attempts: ${error}`);
          console.error(`[Offline] Giving up after ${MAX_REPLAY_RETRIES} retries:`, error);
        } else {
          const delay = REPLAY_BASE_DELAY * Math.pow(2, retryCountRef.current);
          console.warn(`[Offline] Replay failed, retrying in ${delay}ms...`);
          setTimeout(() => {
            syncingRef.current = false;
            replayNow();
          }, delay);
          return;
        }
      } else {
        // Success — clear the queue
        await clearQueue();
        setQueueSize(0);
        retryCountRef.current = 0;
        console.log("[Offline] Queue replayed and cleared successfully");
      }
    } catch (err) {
      console.error("[Offline] Replay error:", err);
      setLastSyncError(err instanceof Error ? err.message : String(err));
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [saveFn]);

  // Auto-replay when coming back online
  useEffect(() => {
    if (isOnline && queueSize > 0) {
      // Small delay to let network stabilize
      const timer = setTimeout(() => {
        replayNow();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queueSize, replayNow]);

  // Listen for SW background sync messages
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "REPLAY_OFFLINE_QUEUE") {
        console.log("[Offline] Received SW background sync signal, replaying queue...");
        replayNow();
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [replayNow]);

  // Enqueue
  const enqueue = useCallback(
    async (payload: Record<string, unknown>) => {
      await enqueueMutation(payload);
      await refreshQueueSize();
    },
    [refreshQueueSize]
  );

  return {
    isOnline,
    queueSize,
    isSyncing,
    lastSyncError,
    replayNow,
    enqueue,
  };
}