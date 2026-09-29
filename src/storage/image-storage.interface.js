/**
 * Abstract Image Storage Interface
 * Abstract contract that can be backed by IndexedDB (V1) or Cloudinary/S3 (Future).
 */
export class IImageStorage {
  /**
   * Stores an image file and returns its stored metadata reference.
   * @param {File|Blob} file
   * @param {Object} [meta]
   * @returns {Promise<{ id: string, name: string, sizeBytes: number, mimeType: string, createdAt: string }>}
   */
  async storeImage(file, meta) {
    throw new Error('storeImage() must be implemented.');
  }

  /**
   * Retrieves a renderable URL (Blob/Object URL or remote CDN URL) for a stored image ID.
   * @param {string} id
   * @returns {Promise<string|null>}
   */
  async getImageUrl(id) {
    throw new Error('getImageUrl() must be implemented.');
  }

  /**
   * Deletes an image by ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteImage(id) {
    throw new Error('deleteImage() must be implemented.');
  }

  /**
   * Revokes an active object URL to free memory.
   * @param {string} url
   */
  revokeImageUrl(url) {
    // No-op for remote URLs, cleans up blob URLs for local storage
  }
}
