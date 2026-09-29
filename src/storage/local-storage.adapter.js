import { IEntryRepository } from './storage.interface.js';
import { runMigrations } from './migrations.js';
import { sanitizeEntry, validateEntry } from '../models/validation.js';

const ENTRIES_STORAGE_KEY = 'in_progress_entries_v1';

export class LocalStorageAdapter extends IEntryRepository {
  constructor(storageKey = ENTRIES_STORAGE_KEY) {
    super();
    this.storageKey = storageKey;
  }

  /**
   * Internal helper to load raw entries from localStorage.
   */
  _readRaw() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Failed to read entries from LocalStorage:', err);
      return [];
    }
  }

  /**
   * Internal helper to write entries back to localStorage.
   */
  _writeRaw(entries) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
      return true;
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        throw new Error('Local storage quota exceeded. Please export or remove some entries.');
      }
      throw new Error(`Failed to save entries to local storage: ${err.message}`);
    }
  }

  async getAll() {
    const raw = this._readRaw();
    const migrated = runMigrations(raw);

    // Sort chronologically (newest date first, then newest createdAt)
    return migrated.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }

  async getById(id) {
    if (!id) return null;
    const all = await this.getAll();
    return all.find((entry) => entry.id === id) || null;
  }

  async getByDate(date) {
    if (!date) return null;
    const all = await this.getAll();
    return all.find((entry) => entry.date === date) || null;
  }

  async save(rawEntry) {
    const validation = validateEntry(rawEntry);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const sanitized = sanitizeEntry(rawEntry);
    const id = sanitized.id || `entry_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const all = await this.getAll();
    const index = all.findIndex((e) => e.id === id);

    const now = new Date().toISOString();
    let savedEntry;

    if (index >= 0) {
      // Update existing entry
      savedEntry = {
        ...all[index],
        ...sanitized,
        id,
        updatedAt: now,
      };
      all[index] = savedEntry;
    } else {
      // Create new entry
      savedEntry = {
        ...sanitized,
        id,
        createdAt: sanitized.createdAt || now,
        updatedAt: now,
      };
      all.unshift(savedEntry);
    }

    this._writeRaw(all);
    return savedEntry;
  }

  async delete(id) {
    if (!id) return false;
    const all = await this.getAll();
    const filtered = all.filter((entry) => entry.id !== id);

    if (filtered.length === all.length) {
      return false; // Nothing deleted
    }

    this._writeRaw(filtered);
    return true;
  }

  async search(query) {
    const all = await this.getAll();
    if (!query || typeof query !== 'string' || !query.trim()) {
      return all;
    }

    const q = query.trim().toLowerCase();

    return all.filter((entry) => {
      // 1. Check title
      if (entry.title && entry.title.toLowerCase().includes(q)) return true;

      // 2. Check date
      if (entry.date && entry.date.toLowerCase().includes(q)) return true;

      // 3. Check tags
      if (entry.tags && Array.isArray(entry.tags)) {
        if (entry.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
      }

      // 4. Check core text fields
      const textFields = [
        entry.didToday,
        entry.learned,
        entry.built,
        entry.challenges,
        entry.solutions,
        entry.importantMoments,
        entry.discoveries,
        entry.improvements,
        entry.tomorrow,
        entry.dsa,
        entry.projects,
        entry.collegeWork,
        entry.mistakes,
        ...(entry.customSections ? Object.values(entry.customSections) : []),
      ];

      return textFields.some(
        (field) => field && typeof field === 'string' && field.toLowerCase().includes(q)
      );
    });
  }
}

// Singleton instance for the application
export const entryRepository = new LocalStorageAdapter();
