const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');
const BaseImageUploadRepository = require('./base.image-upload.repository');

/**
 * Cloudinary Image Upload Repository
 * Uploads images to Cloudinary CDN and returns public URLs
 */
class CloudinaryImageUploadRepository extends BaseImageUploadRepository {
  constructor() {
    super();
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('[CloudinaryImageUpload] Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }
  }

  /**
   * Convert buffer to stream for Cloudinary upload
   * @param {Buffer} buffer - File buffer
   * @returns {Readable} Stream
   */
  bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  /**
   * Upload file to Cloudinary
   * @param {Object} file - Multer file object
   * @param {Object} options - Upload options { folder, publicId, transformation }
   * @returns {Promise<Object>} Upload result
   */
  async upload(file, options = {}) {
    if (!file || !file.buffer) {
      throw new Error('File buffer is required');
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'auto',
        folder: options.folder || 'food-reservation',
      };

      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      if (options.transformation) {
        uploadOptions.transformation = options.transformation;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('[CloudinaryImageUpload] Upload error:', error);
            reject(error);
          } else {
            resolve({
              url: result.secure_url || result.url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              size: result.bytes || file.size || 0
            });
          }
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      this.bufferToStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete file from Cloudinary
   * @param {string} url - Image URL
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(url) {
    if (!url || !this.isOwnUrl(url)) {
      return false;
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('[CloudinaryImageUpload] Cloudinary not configured, cannot delete');
      return false;
    }

    try {
      // Extract public_id from URL
      const publicId = this.extractPublicId(url);
      if (!publicId) {
        return false;
      }

      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok' || result.result === 'not found';
    } catch (error) {
      console.error('[CloudinaryImageUpload] Delete error:', error);
      return false;
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string|null} Public ID
   */
  extractPublicId(url) {
    if (!url) return null;
    
    try {
      // Cloudinary URLs have format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match && match[1]) {
        return match[1];
      }
      
      // Fallback: try to extract from path
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex >= 0 && uploadIndex < pathParts.length - 1) {
        // Skip version if present
        const publicIdParts = pathParts.slice(uploadIndex + 1);
        if (publicIdParts[0] && publicIdParts[0].match(/^v\d+$/)) {
          publicIdParts.shift();
        }
        return publicIdParts.join('/').replace(/\.[^.]+$/, '');
      }
      
      return null;
    } catch (error) {
      console.error('[CloudinaryImageUpload] Error extracting public_id:', error);
      return null;
    }
  }

  /**
   * Get full URL for a path
   * @param {string} path - Internal path (public_id or URL)
   * @returns {string} Full URL
   */
  getUrl(path) {
    if (!path) return '';
    // If already a full URL, return as is
    if (path.startsWith('http')) {
      return path;
    }
    // If it's a public_id, construct URL
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${path}`;
    }
    return path;
  }

  /**
   * Check if URL belongs to Cloudinary
   * @param {string} url - Image URL
   * @returns {boolean} True if Cloudinary URL
   */
  isOwnUrl(url) {
    if (!url) return false;
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  }
}

module.exports = CloudinaryImageUploadRepository;

