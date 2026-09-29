import { EntryModel } from '../models/Entry.js';
import { isConnected } from '../config/db.js';

/**
 * Escapes special regex characters in user input to prevent ReDoS attacks.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const entryService = {
  /**
   * Retrieves all entries sorted chronologically (newest first).
   */
  async getAll() {
    if (!isConnected()) {
      throw new Error('Database is currently offline. Please verify MONGODB_URI.');
    }
    const entries = await EntryModel.find().sort({ date: -1, createdAt: -1 });
    return entries.map((doc) => doc.toJSON());
  },

  /**
   * Retrieves an entry by its client ID or MongoDB ID.
   */
  async getById(id) {
    if (!isConnected()) {
      throw new Error('Database is currently offline. Please verify MONGODB_URI.');
    }
    const entry = await EntryModel.findOne({ id });
    return entry ? entry.toJSON() : null;
  },

  /**
   * Creates a new entry.
   */
  async create(data) {
    if (!isConnected()) {
      throw new Error('Database is currently offline. Please verify MONGODB_URI.');
    }

    const id = data.id || `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const doc = new EntryModel({
      ...data,
      id,
      createdAt: data.createdAt || now,
      updatedAt: now,
    });

    const saved = await doc.save();
    return saved.toJSON();
  },

  /**
   * Updates an existing entry by its ID.
   */
  async update(id, updates) {
    if (!isConnected()) {
      throw new Error('Database is currently offline. Please verify MONGODB_URI.');
    }

    const existing = await EntryModel.findOne({ id });
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    Object.assign(existing, updates, { updatedAt: now });

    const saved = await existing.save();
    return saved.toJSON();
  },

  /**
   * Deletes an entry by its ID.
   */
  async delete(id) {
    if (!isConnected()) {
      throw new Error('Database is currently offline. Please verify MONGODB_URI.');
    }

    const result = await EntryModel.deleteOne({ id });
    return result.deletedCount > 0;
  },

  /**
   * Searches entries matching a query across text, title, tags, and date.
   */
  async search(query) {
    if (!isConnected()) {
      throw new Error('Database is currently offline. Please verify MONGODB_URI.');
    }

    if (!query || !query.trim()) {
      return this.getAll();
    }

    const q = query.trim();
    const regex = new RegExp(escapeRegex(q), 'i');

    const entries = await EntryModel.find({
      $or: [
        { title: regex },
        { date: regex },
        { tags: regex },
        { didToday: regex },
        { learned: regex },
        { built: regex },
        { challenges: regex },
        { solutions: regex },
        { importantMoments: regex },
        { discoveries: regex },
        { improvements: regex },
        { tomorrow: regex },
        { dsa: regex },
        { projects: regex },
        { collegeWork: regex },
        { mistakes: regex },
      ],
    }).sort({ date: -1 });

    return entries.map((doc) => doc.toJSON());
  },
};
