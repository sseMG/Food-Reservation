const path = require('path');
const fs = require('fs-extra');
const FilesystemImageUploadRepository = require('../../../repositories/image-upload/filesystem.image-upload.repository');

describe('FilesystemImageUploadRepository', () => {
  let repository;
  let testUploadDir;

  beforeAll(() => {
    // Create a temporary test upload directory
    testUploadDir = path.join(__dirname, '..', '..', '..', 'test-uploads');
    fs.ensureDirSync(testUploadDir);
    repository = new FilesystemImageUploadRepository(testUploadDir);
  });

  afterAll(async () => {
    // Cleanup: remove test upload directory
    if (await fs.pathExists(testUploadDir)) {
      await fs.remove(testUploadDir);
    }
  });

  afterEach(async () => {
    // Clean up uploaded files after each test
    const files = await fs.readdir(testUploadDir).catch(() => []);
    for (const file of files) {
      await fs.unlink(path.join(testUploadDir, file)).catch(() => {});
    }
  });

  describe('upload', () => {
    it('should upload a file and return URL', async () => {
      const file = {
        buffer: Buffer.from('test image content'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 20
      };

      const result = await repository.upload(file);

      expect(result).toHaveProperty('url');
      expect(result.url).toMatch(/^\/uploads\//);
      expect(result).toHaveProperty('publicId');
      expect(result).toHaveProperty('format', 'jpeg');
      expect(result).toHaveProperty('size', 20);

      // Verify file exists on filesystem
      const filename = path.basename(result.url);
      const filePath = path.join(testUploadDir, filename);
      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it('should use prefix in filename when provided', async () => {
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'image.png',
        mimetype: 'image/png',
        size: 10
      };

      const result = await repository.upload(file, { prefix: 'menu-item' });

      expect(result.publicId).toContain('menu-item');
      expect(result.url).toContain('menu-item');
    });

    it('should throw error if file buffer is missing', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg'
      };

      await expect(repository.upload(file)).rejects.toThrow('File buffer is required');
    });
  });

  describe('delete', () => {
    it('should delete an uploaded file', async () => {
      // Upload a file first
      const file = {
        buffer: Buffer.from('test content'),
        originalname: 'delete-test.jpg',
        mimetype: 'image/jpeg',
        size: 12
      };

      const uploadResult = await repository.upload(file);
      const filename = path.basename(uploadResult.url);
      const filePath = path.join(testUploadDir, filename);

      // Verify file exists
      expect(await fs.pathExists(filePath)).toBe(true);

      // Delete the file
      const deleted = await repository.delete(uploadResult.url);
      expect(deleted).toBe(true);

      // Verify file is deleted
      expect(await fs.pathExists(filePath)).toBe(false);
    });

    it('should return false for non-existent file', async () => {
      const deleted = await repository.delete('/uploads/nonexistent.jpg');
      expect(deleted).toBe(false);
    });

    it('should return false for non-filesystem URLs', async () => {
      const deleted = await repository.delete('https://cloudinary.com/image.jpg');
      expect(deleted).toBe(false);
    });
  });

  describe('getUrl', () => {
    it('should return URL for a filename', () => {
      const url = repository.getUrl('test.jpg');
      expect(url).toBe('/uploads/test.jpg');
    });

    it('should return URL as-is if already a full path', () => {
      const url = repository.getUrl('/uploads/existing.jpg');
      expect(url).toBe('/uploads/existing.jpg');
    });

    it('should return empty string for empty path', () => {
      const url = repository.getUrl('');
      expect(url).toBe('');
    });
  });

  describe('isOwnUrl', () => {
    it('should return true for filesystem URLs', () => {
      expect(repository.isOwnUrl('/uploads/test.jpg')).toBe(true);
      expect(repository.isOwnUrl('uploads/test.jpg')).toBe(true);
    });

    it('should return false for HTTP URLs', () => {
      expect(repository.isOwnUrl('https://cloudinary.com/image.jpg')).toBe(false);
      expect(repository.isOwnUrl('http://example.com/image.jpg')).toBe(false);
    });

    it('should return false for empty or null URLs', () => {
      expect(repository.isOwnUrl('')).toBe(false);
      expect(repository.isOwnUrl(null)).toBe(false);
    });
  });
});

