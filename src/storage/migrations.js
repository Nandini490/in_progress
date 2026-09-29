import { CURRENT_SCHEMA_VERSION, normalizeEntry } from '../models/entry.model.js';

/**
 * Migration pipeline for entries loaded from storage.
 * Safely applies upgrades if the stored schema is behind CURRENT_SCHEMA_VERSION.
 */
export function runMigrations(rawEntries) {
  if (!Array.isArray(rawEntries)) return [];

  return rawEntries.map((item) => {
    let entry = { ...item };
    const version = entry.schemaVersion || 0;

    if (version < 1) {
      entry = migrateToV1(entry);
    }

    // Future version migrations can be added here:
    // if (version < 2) { entry = migrateToV2(entry); }

    return normalizeEntry(entry);
  });
}

function migrateToV1(oldEntry) {
  return {
    ...oldEntry,
    schemaVersion: 1,
    customSections: oldEntry.customSections || {},
    tags: Array.isArray(oldEntry.tags) ? oldEntry.tags : [],
    links: Array.isArray(oldEntry.links) ? oldEntry.links : [],
    images: Array.isArray(oldEntry.images) ? oldEntry.images : [],
  };
}
