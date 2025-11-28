const fs = require('fs');

const CloudinaryImageUploadRepository = require('../../../repositories/image-upload/cloudinary.image-upload.repository');
const path = require('path');

describe('CloudinaryImageUploadRepository', () => {
  let repository = new CloudinaryImageUploadRepository();
  let uploaded_image1_url = '';
  let uploaded_image2_url = '';

  const img1_buf = fs.readFileSync(path.join(__dirname, 'test.jpg'));
  const img2_buf = fs.readFileSync(path.join(__dirname, 'test.png'));

  const file1 = {
    buffer: img1_buf,
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
    size: img1_buf.length
  };

  const file2 = {
    buffer: img2_buf,
    originalname: 'test.png',
    mimetype: 'image/png',
    size: img2_buf.length
  };

  it('upload an image', async () => {
    const result = await repository.upload(file1);

    expect(result).toHaveProperty('url');
    expect(result.url).toContain('cloudinary.com');
    expect(result).toHaveProperty('publicId');
    expect(result).toHaveProperty('format', 'jpg');
    expect(result).toHaveProperty('width', 755);
    expect(result).toHaveProperty('height', 489);

    uploaded_image1_url = result.url;
  });

  it('use folder option when provided', async () => {
    const result = await repository.upload(file2, { folder: 'custom-folder' });

    expect(result).toHaveProperty('url');
    expect(result.url).toContain('cloudinary.com');
    expect(result).toHaveProperty('publicId');
    expect(result).toHaveProperty('format', 'png');

    uploaded_image2_url = result.url;
  });

  it('should extract public_id from Cloudinary URL', () => {
    const publicId1 = repository.extractPublicId(uploaded_image1_url);
    expect(publicId1).toBeTruthy();
    const publicId2 = repository.extractPublicId(uploaded_image2_url);
    expect(publicId2).toBeTruthy();
  });

  it('should return true for Cloudinary URLs', () => {
    expect(repository.isOwnUrl(uploaded_image1_url)).toBe(true);
    expect(repository.isOwnUrl(uploaded_image2_url)).toBe(true);
  });

  it('should return false for empty or null URLs', () => {
    expect(repository.isOwnUrl('')).toBe(false);
    expect(repository.isOwnUrl(null)).toBe(false);
  });

  it('should return false for non-Cloudinary URLs', async () => {
    const deleted = await repository.delete('/uploads/test.jpg');
    expect(deleted).toBe(false);
  });

  it('getURL should return URL as-is if already a full URL', () => {
    const result1 = repository.getUrl(uploaded_image1_url);
    expect(result1).toBe(uploaded_image1_url);

    const result2 = repository.getUrl(uploaded_image2_url);
    expect(result2).toBe(uploaded_image2_url);
  });

  it('should return false for empty or null URLs', async () => {
    expect(await repository.delete('')).toBe(false);
    expect(await repository.delete(null)).toBe(false);
  });

  it('should delete an image from Cloudinary', async () => {
    const deleted1 = await repository.delete(uploaded_image1_url);
    expect(deleted1).toBe(true);

    const deleted2 = await repository.delete(uploaded_image2_url);
    expect(deleted2).toBe(true);
  });
});

describe('getUrl', () => {
  let repository = new CloudinaryImageUploadRepository();

  it('should return URL for a public_id', () => {
    const url = repository.getUrl('food-reservation/test');
    expect(url).toContain('cloudinary.com');
    expect(url).toContain('food-reservation/test');
  });

  it('should return empty string for empty path', () => {
    const url = repository.getUrl('');
    expect(url).toBe('');
  });
});


