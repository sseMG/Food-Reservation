const path = require('path');
const fs = require('fs-extra');
const BaseImageUploadRepository = require('./base.image-upload.repository');

/**
 * Filesystem Image Upload Repository
 * Saves images to local filesystem and serves via Express static middleware
 */
class FilesystemImageUploadRepository extends BaseImageUploadRepository {
  constructor(uploadDir = null) {
    super();
    this.uploadDir = uploadDir || path.join(__dirname, '..', '..', 'uploads');
    fs.ensureDirSync(this.uploadDir);
  }

  /**
   * Generate a safe filename
   * @param {string} originalname - Original filename
   * @param {string} prefix - Optional prefix for filename
   * @returns {string} Safe filename
   */
  generateFilename(originalname, prefix = '') {
    const ext = path.extname(originalname || '') || '.jpg';
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e6);
    const safePrefix = prefix ? `${prefix}-` : '';
    return `${safePrefix}${timestamp}_${random}${ext}`;
  }

  /**
   * Upload file to filesystem
   * @param {Object} file - Multer file object
   * @param {Object} options - Upload options { folder, publicId }
   * @returns {Promise<Object>} Upload result
   */
  async upload(file, options = {}) {
    if (!file || !file.buffer) {
      throw new Error('File buffer is required');
    }

    const filename = options.publicId 
      ? `${options.publicId}${path.extname(file.originalname || '') || '.jpg'}`
      : this.generateFilename(file.originalname, options.prefix);

    const filePath = path.join(this.uploadDir, filename);
    await fs.writeFile(filePath, file.buffer);

    const url = `/uploads/${filename}`;

    return {
      url,
      publicId: filename,
      format: (file.mimetype || '').split('/').pop() || 'jpg',
      width: null,
      height: null,
      size: file.size || 0
    };
  }

  /**
   * Delete file from filesystem
   * @param {string} url - Image URL (e.g., /uploads/filename.jpg)
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(url) {
    if (!url || !this.isOwnUrl(url)) {
      return false;
    }

    try {
      const filename = path.basename(url);
      const filePath = path.join(this.uploadDir, filename);
      
      if (await fs.pathExists(filePath)) {
        await fs.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[FilesystemImageUpload] Delete error:', error);
      return false;
    }
  }

  /**
   * Get full URL for a path
   * @param {string} path - Internal path (filename)
   * @returns {string} Full URL
   */
  getUrl(path) {
    if (!path) return '';
    // If already a full URL or starts with /uploads, return as is
    if (path.startsWith('http') || path.startsWith('/uploads')) {
      return path;
    }
    return `/uploads/${path}`;
  }

  /**
   * Check if URL belongs to filesystem storage
   * @param {string} url - Image URL
   * @returns {boolean} True if filesystem URL
   */
  isOwnUrl(url) {
    if (!url) return false;
    return url.startsWith('/uploads/') || (!url.startsWith('http') && !url.startsWith('//'));
  }
}

module.exports = FilesystemImageUploadRepository;

