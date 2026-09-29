export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Creates an empty, standardized entry with defaults.
 * Extensible for custom tracks and dynamic sections.
 */
export function createEmptyEntry(dateString) {
  const localToday = dateString || new Date().toISOString().split('T')[0];

  return {
    id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    date: localToday,
    title: '',

    // Core Journal Fields
    didToday: '',
    learned: '',
    built: '',
    challenges: '',
    solutions: '',
    importantMoments: '',
    discoveries: '',
    improvements: '',
    tomorrow: '',

    // Optional Life Tracks (Extensible)
    dsa: '',
    projects: '',
    collegeWork: '',
    mistakes: '',

    // Dynamic / Custom Sections Map (Future-proofing)
    customSections: {},

    // Metadata & Attachments
    tags: [],
    links: [],
    // Images store metadata only; binary blobs live in IndexedDB
    images: [],

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Normalizes an entry from storage, ensuring all default fields exist.
 */
export function normalizeEntry(raw) {
  if (!raw) return createEmptyEntry();
  const empty = createEmptyEntry(raw.date);

  return {
    ...empty,
    ...raw,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    links: Array.isArray(raw.links) ? raw.links : [],
    images: Array.isArray(raw.images) ? raw.images : [],
    customSections: raw.customSections && typeof raw.customSections === 'object' ? raw.customSections : {},
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}
