/**
 * Base Image Upload Repository Interface
 * Abstract base class for all image upload repository implementations
 */
class BaseImageUploadRepository {
  /**
   * Upload an image file
   * @param {Object} file - Multer file object { buffer, originalname, mimetype, size }
   * @param {Object} options - Upload options { folder, publicId, transformation }
   * @returns {Promise<Object>} Upload result { url, publicId, format, width, height }
   */
  async upload(file, options = {}) {
    throw new Error('upload must be implemented by subclass');
  }

  /**
   * Delete an image by URL
   * @param {string} url - Image URL to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(url) {
    throw new Error('delete must be implemented by subclass');
  }

  /**
   * Get full URL for an image path
   * @param {string} path - Internal path identifier
   * @returns {string} Full URL for accessing the image
   */
  getUrl(path) {
    throw new Error('getUrl must be implemented by subclass');
  }

  /**
   * Check if a URL belongs to this storage backend
   * @param {string} url - Image URL to check
   * @returns {boolean} True if URL belongs to this backend
   */
  isOwnUrl(url) {
    throw new Error('isOwnUrl must be implemented by subclass');
  }
}

module.exports = BaseImageUploadRepository;

