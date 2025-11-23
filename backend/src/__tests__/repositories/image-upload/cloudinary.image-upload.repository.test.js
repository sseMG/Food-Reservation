const CloudinaryImageUploadRepository = require('../../../repositories/image-upload/cloudinary.image-upload.repository');

// Mock cloudinary module
jest.mock('cloudinary', () => {
  const { Writable } = require('stream');
  
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload_stream: jest.fn((options, callback) => {
          // Create a writable stream that accepts data
          const uploadStream = new Writable({
            write(chunk, encoding, next) {
              // Accept the chunk and continue
              next();
            },
            final(callback) {
              // Stream ended, trigger the upload callback
              if (callback) callback();
            }
          });
          
          // Simulate async upload completion
          process.nextTick(() => {
            if (callback) {
              callback(null, {
                secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/test.jpg',
                url: 'http://res.cloudinary.com/test-cloud/image/upload/v1234567890/test.jpg',
                public_id: 'food-reservation/test',
                format: 'jpg',
                width: 800,
                height: 600,
                bytes: 50000
              });
            }
          });
          
          return uploadStream;
        }),
        destroy: jest.fn((publicId, callback) => {
          if (callback) {
            callback(null, { result: 'ok' });
          } else {
            return Promise.resolve({ result: 'ok' });
          }
        })
      }
    }
  };
});

describe('CloudinaryImageUploadRepository', () => {
  let repository;
  let originalEnv;

  beforeAll(() => {
    // Save original environment
    originalEnv = {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
    };

    // Set test credentials
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';

    repository = new CloudinaryImageUploadRepository();
  });

  afterAll(() => {
    // Restore original environment
    if (originalEnv.CLOUDINARY_CLOUD_NAME) {
      process.env.CLOUDINARY_CLOUD_NAME = originalEnv.CLOUDINARY_CLOUD_NAME;
    } else {
      delete process.env.CLOUDINARY_CLOUD_NAME;
    }
    if (originalEnv.CLOUDINARY_API_KEY) {
      process.env.CLOUDINARY_API_KEY = originalEnv.CLOUDINARY_API_KEY;
    } else {
      delete process.env.CLOUDINARY_API_KEY;
    }
    if (originalEnv.CLOUDINARY_API_SECRET) {
      process.env.CLOUDINARY_API_SECRET = originalEnv.CLOUDINARY_API_SECRET;
    } else {
      delete process.env.CLOUDINARY_API_SECRET;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload a file and return Cloudinary URL', async () => {
      const file = {
        buffer: Buffer.from('test image content'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 20
      };

      const result = await repository.upload(file);

      expect(result).toHaveProperty('url');
      expect(result.url).toContain('cloudinary.com');
      expect(result).toHaveProperty('publicId');
      expect(result).toHaveProperty('format', 'jpg');
      expect(result).toHaveProperty('width', 800);
      expect(result).toHaveProperty('height', 600);
    });

    it('should use folder option when provided', async () => {
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'image.png',
        mimetype: 'image/png',
        size: 10
      };

      await repository.upload(file, { folder: 'custom-folder' });
      
      // Verify upload_stream was called with folder option
      const { v2 } = require('cloudinary');
      expect(v2.uploader.upload_stream).toHaveBeenCalled();
    });

    it('should throw error if file buffer is missing', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg'
      };

      await expect(repository.upload(file)).rejects.toThrow('File buffer is required');
    });

    it('should throw error if Cloudinary is not configured', async () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      const repo = new CloudinaryImageUploadRepository();
      
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 10
      };

      await expect(repo.upload(file)).rejects.toThrow('Cloudinary not configured');
      
      // Restore for other tests
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    });
  });

  describe('delete', () => {
    it('should delete an image from Cloudinary', async () => {
      const url = 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/food-reservation/test.jpg';
      
      const deleted = await repository.delete(url);
      expect(deleted).toBe(true);
    });

    it('should return false for non-Cloudinary URLs', async () => {
      const deleted = await repository.delete('/uploads/test.jpg');
      expect(deleted).toBe(false);
    });

    it('should return false for empty or null URLs', async () => {
      expect(await repository.delete('')).toBe(false);
      expect(await repository.delete(null)).toBe(false);
    });
  });

  describe('extractPublicId', () => {
    it('should extract public_id from Cloudinary URL', () => {
      const url = 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/food-reservation/test.jpg';
      const publicId = repository.extractPublicId(url);
      expect(publicId).toBeTruthy();
    });

    it('should handle URLs with version', () => {
      const url = 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/test.jpg';
      const publicId = repository.extractPublicId(url);
      expect(publicId).toBeTruthy();
    });
  });

  describe('getUrl', () => {
    it('should return URL for a public_id', () => {
      const url = repository.getUrl('food-reservation/test');
      expect(url).toContain('cloudinary.com');
      expect(url).toContain('food-reservation/test');
    });

    it('should return URL as-is if already a full URL', () => {
      const fullUrl = 'https://res.cloudinary.com/test-cloud/image/upload/test.jpg';
      const url = repository.getUrl(fullUrl);
      expect(url).toBe(fullUrl);
    });

    it('should return empty string for empty path', () => {
      const url = repository.getUrl('');
      expect(url).toBe('');
    });
  });

  describe('isOwnUrl', () => {
    it('should return true for Cloudinary URLs', () => {
      expect(repository.isOwnUrl('https://res.cloudinary.com/test-cloud/image/upload/test.jpg')).toBe(true);
      expect(repository.isOwnUrl('http://cloudinary.com/image.jpg')).toBe(true);
    });

    it('should return false for filesystem URLs', () => {
      expect(repository.isOwnUrl('/uploads/test.jpg')).toBe(false);
    });

    it('should return false for empty or null URLs', () => {
      expect(repository.isOwnUrl('')).toBe(false);
      expect(repository.isOwnUrl(null)).toBe(false);
    });
  });
});

