import { LocalStorageAdapter, entryRepository as localRepo } from './local-storage.adapter.js';
import { HttpApiAdapter, httpApiAdapter as httpRepo } from './http-api.adapter.js';

/**
 * Storage Mode Selector
 * Allowed values: 'local' (LocalStorage) | 'cloud' (Express + MongoDB API)
 * Default: 'cloud' to connect frontend directly to Express + MongoDB Atlas
 */
const STORAGE_MODE = (import.meta.env && import.meta.env.VITE_STORAGE_MODE) || 'cloud';

export function getRepository(mode = STORAGE_MODE) {
  if (mode === 'local') {
    return localRepo;
  }
  return httpRepo;
}

// Active repository export used by useEntries hook
export const activeEntryRepository = getRepository();

export { LocalStorageAdapter, HttpApiAdapter, localRepo, httpRepo };
