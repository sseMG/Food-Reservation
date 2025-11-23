const FilesystemImageUploadRepository = require('./filesystem.image-upload.repository');
const CloudinaryImageUploadRepository = require('./cloudinary.image-upload.repository');

/**
 * Image Upload Repository Factory
 * Returns the appropriate image upload repository based on configuration
 */
class ImageUploadFactory {
  static instance = null;

  /**
   * Get the configured image upload repository
   * @returns {BaseImageUploadRepository} Repository instance
   */
  static getRepository() {
    if (this.instance) {
      return this.instance;
    }

    const storageType = (process.env.IMAGE_STORAGE_TYPE || 'filesystem').toLowerCase();

    switch (storageType) {
      case 'cloudinary':
        this.instance = new CloudinaryImageUploadRepository();
        console.log('[ImageUploadFactory] Using Cloudinary storage');
        break;
      case 'filesystem':
      default:
        this.instance = new FilesystemImageUploadRepository();
        console.log('[ImageUploadFactory] Using filesystem storage');
        break;
    }

    return this.instance;
  }

  /**
   * Clear the cached repository instance (useful for testing)
   */
  static clearCache() {
    this.instance = null;
  }

  /**
   * Get current storage type
   * @returns {string} Storage type ('filesystem' or 'cloudinary')
   */
  static getStorageType() {
    return (process.env.IMAGE_STORAGE_TYPE || 'filesystem').toLowerCase();
  }
}

module.exports = ImageUploadFactory;

