const DRAFT_STORAGE_KEY = 'in_progress_draft_v1';

export const autosaveService = {
  /**
   * Saves a working draft to local storage.
   */
  saveDraft(draftData) {
    if (!draftData) return;
    try {
      const payload = {
        entry: draftData,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to save working draft:', err);
    }
  },

  /**
   * Retrieves the current working draft if it exists.
   */
  getDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.entry) {
        return parsed;
      }
      return null;
    } catch (err) {
      console.warn('Failed to parse working draft:', err);
      return null;
    }
  },

  /**
   * Clears the current draft (called after saving or when discarded).
   */
  clearDraft() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear working draft:', err);
    }
  },

  /**
   * Checks if an unsaved draft exists.
   */
  hasDraft() {
    try {
      return localStorage.getItem(DRAFT_STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  },
};
