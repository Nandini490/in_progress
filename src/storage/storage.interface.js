/**
 * Abstract Entry Repository Interface
 * Defines the contract that LocalStorageAdapter (and future HttpApiAdapter) implements.
 */
export class IEntryRepository {
  /**
   * Retrieves all entries sorted chronologically (newest first).
   * @returns {Promise<Array>}
   */
  async getAll() {
    throw new Error('getAll() must be implemented.');
  }

  /**
   * Retrieves an entry by its unique ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    throw new Error('getById() must be implemented.');
  }

  /**
   * Retrieves an entry for a specific calendar date (YYYY-MM-DD).
   * @param {string} date
   * @returns {Promise<Object|null>}
   */
  async getByDate(date) {
    throw new Error('getByDate() must be implemented.');
  }

  /**
   * Saves an entry (creates new or updates existing).
   * @param {Object} entry
   * @returns {Promise<Object>}
   */
  async save(entry) {
    throw new Error('save() must be implemented.');
  }

  /**
   * Deletes an entry by ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('delete() must be implemented.');
  }

  /**
   * Searches entries by query string across title, content, tags, and date.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async search(query) {
    throw new Error('search() must be implemented.');
  }
}
