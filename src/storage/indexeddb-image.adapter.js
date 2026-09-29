import { IImageStorage } from './image-storage.interface.js';

const DB_NAME = 'InProgressMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_store';

export class IndexedDbImageAdapter extends IImageStorage {
  constructor() {
    super();
    this.dbPromise = null;
    this.activeUrls = new Map(); // id -> objectUrl cache
  }

  /**
   * Initializes or returns open IndexedDB instance.
   */
  async _getDb() {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async storeImage(file, meta = {}) {
    const db = await this._getDb();
    const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const record = {
      id,
      blob: file,
      name: meta.name || file.name || 'screenshot.png',
      sizeBytes: file.size,
      mimeType: file.type || 'image/png',
      caption: meta.caption || '',
      createdAt: now,
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Return metadata reference only (no blob/base64 in entry metadata)
    return {
      id: record.id,
      name: record.name,
      sizeBytes: record.sizeBytes,
      mimeType: record.mimeType,
      caption: record.caption,
      createdAt: record.createdAt,
    };
  }

  async getImageUrl(id) {
    if (!id) return null;

    // Check memory cache
    if (this.activeUrls.has(id)) {
      return this.activeUrls.get(id);
    }

    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result;
        if (!record || !record.blob) {
          resolve(null);
          return;
        }

        const objectUrl = URL.createObjectURL(record.blob);
        this.activeUrls.set(id, objectUrl);
        resolve(objectUrl);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async deleteImage(id) {
    if (!id) return false;

    // Revoke cached URL
    if (this.activeUrls.has(id)) {
      URL.revokeObjectURL(this.activeUrls.get(id));
      this.activeUrls.delete(id);
    }

    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  revokeImageUrl(url) {
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revoke errors
      }
    }
  }

  /**
   * Releases a cached object URL for a specific image ID, freeing browser memory.
   * The image data remains safely in IndexedDB for future access.
   * @param {string} id
   */
  releaseImage(id) {
    if (this.activeUrls.has(id)) {
      try {
        URL.revokeObjectURL(this.activeUrls.get(id));
      } catch {
        // Ignore revoke errors
      }
      this.activeUrls.delete(id);
    }
  }
}

// Singleton instance
export const imageStorage = new IndexedDbImageAdapter();
