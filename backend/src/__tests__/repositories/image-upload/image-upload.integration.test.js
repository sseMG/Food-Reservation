const request = require('supertest');
const path = require('path');
const fs = require('fs-extra');
const app = require('../../../index');
const ImageUploadFactory = require('../../../repositories/image-upload/image-upload.factory');
const RepositoryFactory = require('../../../repositories/repository.factory');
const { createTestAdmin, getAuthHeaders } = require('../../helpers/test-helpers');

describe('Image Upload Integration Tests', () => {
  let admin;
  let headers;
  let testUploadDir;
  let originalStorageType;
  let uploadedUrls = []; // Track uploaded URLs for cleanup

  beforeAll(async () => {
    admin = await createTestAdmin();
    headers = getAuthHeaders(admin);
    
    // Create test upload directory
    testUploadDir = path.join(__dirname, '..', '..', '..', 'test-uploads');
    fs.ensureDirSync(testUploadDir);
    
    // Save original storage type
    originalStorageType = process.env.IMAGE_STORAGE_TYPE;
  });

  afterAll(async () => {
    // Restore original storage type
    if (originalStorageType) {
      process.env.IMAGE_STORAGE_TYPE = originalStorageType;
    } else {
      delete process.env.IMAGE_STORAGE_TYPE;
    }
    
    // Cleanup test uploads
    await cleanupTestUploads();
    
    // Remove test upload directory
    if (await fs.pathExists(testUploadDir)) {
      await fs.remove(testUploadDir);
    }
    
    ImageUploadFactory.clearCache();
  });

  beforeEach(() => {
    uploadedUrls = [];
    ImageUploadFactory.clearCache();
  });

  async function cleanupTestUploads() {
    const imageRepo = ImageUploadFactory.getRepository();
    
    for (const url of uploadedUrls) {
      try {
        await imageRepo.delete(url);
      } catch (error) {
        console.warn(`Failed to cleanup upload: ${url}`, error.message);
      }
    }
    
    // Also cleanup filesystem test files
    if (await fs.pathExists(testUploadDir)) {
      const files = await fs.readdir(testUploadDir).catch(() => []);
      for (const file of files) {
        await fs.unlink(path.join(testUploadDir, file)).catch(() => {});
      }
    }
  }

  // Helper to create a test image file
  function createTestImageFile() {
    // Create a minimal valid JPEG buffer (1x1 pixel)
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
      0x4A, 0xFF, 0xD9
    ]);
    return jpegHeader;
  }

  describe('Filesystem Storage', () => {
    beforeEach(() => {
      process.env.IMAGE_STORAGE_TYPE = 'filesystem';
      ImageUploadFactory.clearCache();
    });

    test('should upload menu item image via admin endpoint', async () => {
      const imageBuffer = createTestImageFile();
      
      const response = await request(app)
        .post('/api/admin/menu')
        .set(headers)
        .field('name', 'Test Menu Item')
        .field('category', 'Food')
        .field('price', '50')
        .field('stock', '10')
        .field('isActive', 'true')
        .attach('image', imageBuffer, 'test-menu.jpg');

      expect(response.status).toBe(200);
      // Response can be either { status: 200, data: {...} } or { ok: true, item: {...} }
      const item = response.body.data || response.body.item;
      expect(item).toBeDefined();
      expect(item.img).toBeDefined();
      expect(item.img).toMatch(/^\/uploads\//);
      
      if (item && item.img) {
        uploadedUrls.push(item.img);
      }
    });

    test('should upload profile picture via wallets endpoint', async () => {
      const imageBuffer = createTestImageFile();
      
      const response = await request(app)
        .post('/api/wallets/update-profile')
        .set(headers)
        .attach('profilePicture', imageBuffer, 'test-profile.jpg');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      if (response.body.user && response.body.user.profilePictureUrl) {
        uploadedUrls.push(response.body.user.profilePictureUrl);
      }
    });
  });

  describe('Cloudinary Storage', () => {
    beforeEach(() => {
      // Only run Cloudinary tests if credentials are configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || 
          !process.env.CLOUDINARY_API_KEY || 
          !process.env.CLOUDINARY_API_SECRET) {
        console.log('Skipping Cloudinary tests - credentials not configured');
        return;
      }
      
      process.env.IMAGE_STORAGE_TYPE = 'cloudinary';
      ImageUploadFactory.clearCache();
    });

    test('should upload menu item image to Cloudinary', async () => {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('Skipping - Cloudinary not configured');
        return;
      }

      const imageBuffer = createTestImageFile();
      
      const response = await request(app)
        .post('/api/admin/menu')
        .set(headers)
        .field('name', 'Test Menu Item Cloudinary')
        .field('category', 'Food')
        .field('price', '50')
        .field('stock', '10')
        .field('isActive', 'true')
        .attach('image', imageBuffer, 'test-menu-cloudinary.jpg');

      expect(response.status).toBe(200);
      // Response can be either { status: 200, data: {...} } or { ok: true, item: {...} }
      const item = response.body.data || response.body.item;
      expect(item).toBeDefined();
      expect(item.img).toBeDefined();
      expect(item.img).toContain('cloudinary.com');
      
      if (item && item.img) {
        uploadedUrls.push(item.img);
      }
    });

    test('should upload profile picture to Cloudinary', async () => {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('Skipping - Cloudinary not configured');
        return;
      }

      const imageBuffer = createTestImageFile();
      
      const response = await request(app)
        .post('/api/wallets/update-profile')
        .set(headers)
        .attach('profilePicture', imageBuffer, 'test-profile-cloudinary.jpg');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      if (response.body.user && response.body.user.profilePictureUrl) {
        expect(response.body.user.profilePictureUrl).toContain('cloudinary.com');
        uploadedUrls.push(response.body.user.profilePictureUrl);
      }
    });
  });

  describe('Image Upload Factory', () => {
    test('should return filesystem repository by default', () => {
      delete process.env.IMAGE_STORAGE_TYPE;
      ImageUploadFactory.clearCache();
      
      const repo = ImageUploadFactory.getRepository();
      expect(repo.constructor.name).toBe('FilesystemImageUploadRepository');
    });

    test('should return filesystem repository when explicitly set', () => {
      process.env.IMAGE_STORAGE_TYPE = 'filesystem';
      ImageUploadFactory.clearCache();
      
      const repo = ImageUploadFactory.getRepository();
      expect(repo.constructor.name).toBe('FilesystemImageUploadRepository');
    });

    test('should return cloudinary repository when set', () => {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('Skipping - Cloudinary not configured');
        return;
      }
      
      process.env.IMAGE_STORAGE_TYPE = 'cloudinary';
      ImageUploadFactory.clearCache();
      
      const repo = ImageUploadFactory.getRepository();
      expect(repo.constructor.name).toBe('CloudinaryImageUploadRepository');
    });
  });
});

