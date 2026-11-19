/**
 * BlinkDrop Persistent Storage Engine
 * Backed by browser IndexedDB for asynchronous, non-blocking state persistence.
 * Tracks resumable chunk transfer sessions and persistent transfer history logs.
 */

export interface TransferSession {
  fileId: string;
  batchId: string;
  name: string;
  size: number;
  type: string;
  fileIndex: number;
  totalFiles: number;
  bytesReceived: number;
  lastChunkIndex: number;
  totalChunks: number;
  hash?: string;
  status: 'transferring' | 'paused' | 'completed';
  updatedAt: number;
}

export interface HistoryItem {
  id: string;
  name: string;
  size: number;
  type: 'sent' | 'received';
  speed: string;
  peerName: string;
  timestamp: number;
  hash?: string;
  verified?: boolean;
}

const DB_NAME = 'blinkdrop_db';
const DB_VERSION = 1;
const SESSIONS_STORE = 'transfer_sessions';
const HISTORY_STORE = 'transfer_history';

class StorageManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in this environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: Active & Resumable Transfer Sessions
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'fileId' });
          sessionsStore.createIndex('name_size', ['name', 'size'], { unique: false });
        }

        // Store 2: Persistent Transfer History
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- Resumable Transfer Sessions ---

  public async saveSession(session: TransferSession): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.put(session);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[Storage] Error saving transfer session:', err);
    }
  }

  public async getSession(fileId: string): Promise<TransferSession | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.get(fileId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[Storage] Error reading session:', err);
      return null;
    }
  }

  public async findResumableSession(name: string, size: number): Promise<TransferSession | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
        const index = store.index('name_size');
        const req = index.get([name, size]);
        req.onsuccess = () => {
          const res = req.result as TransferSession | undefined;
          if (res && res.status !== 'completed' && res.bytesReceived > 0) {
            resolve(res);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[Storage] Error searching resumable session:', err);
      return null;
    }
  }

  public async updateChunkProgress(
    fileId: string,
    bytesReceived: number,
    lastChunkIndex: number
  ): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(SESSIONS_STORE, 'readwrite');
      const store = tx.objectStore(SESSIONS_STORE);
      const req = store.get(fileId);
      req.onsuccess = () => {
        const session = req.result as TransferSession | undefined;
        if (session) {
          session.bytesReceived = bytesReceived;
          session.lastChunkIndex = lastChunkIndex;
          session.updatedAt = Date.now();
          store.put(session);
        }
      };
    } catch (err) {
      console.warn('[Storage] Error updating chunk progress:', err);
    }
  }

  public async completeSession(fileId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(SESSIONS_STORE, 'readwrite');
      const store = tx.objectStore(SESSIONS_STORE);
      const req = store.get(fileId);
      req.onsuccess = () => {
        const session = req.result as TransferSession | undefined;
        if (session) {
          session.status = 'completed';
          session.updatedAt = Date.now();
          store.put(session);
        }
      };
    } catch (err) {
      console.warn('[Storage] Error completing session:', err);
    }
  }

  public async removeSession(fileId: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.delete(fileId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[Storage] Error removing session:', err);
    }
  }

  // --- Transfer History ---

  public async addHistory(item: HistoryItem): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(HISTORY_STORE, 'readwrite');
        const store = tx.objectStore(HISTORY_STORE);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[Storage] Error adding history:', err);
    }
  }

  public async getHistory(): Promise<HistoryItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(HISTORY_STORE, 'readonly');
        const store = tx.objectStore(HISTORY_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result || []) as HistoryItem[];
          // Sort descending by timestamp (newest first)
          list.sort((a, b) => b.timestamp - a.timestamp);
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[Storage] Error fetching history:', err);
      return [];
    }
  }

  public async clearHistory(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(HISTORY_STORE, 'readwrite');
        const store = tx.objectStore(HISTORY_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[Storage] Error clearing history:', err);
    }
  }
}

export const storageManager = new StorageManager();
