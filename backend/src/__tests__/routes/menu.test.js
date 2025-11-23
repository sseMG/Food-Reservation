const request = require('supertest');
const app = require('../../../src/index');
const RepositoryFactory = require('../../../repositories/repository.factory');
const { createTestAdmin, getAuthHeaders } = require('../helpers/test-helpers');

describe('Menu Routes', () => {
  describe('JSON Database', () => {
    beforeEach(() => {
      delete process.env.MONGO_URI;
      RepositoryFactory.clearCache();
    });
    
    test('GET /api/menu - should list menu items', async () => {
      const menuRepo = RepositoryFactory.getMenuRepository();
      await menuRepo.create({ name: 'Item 1', category: 'Food', price: 50, stock: 10 });
      
      const response = await request(app)
        .get('/api/menu');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    test('POST /api/menu - should create menu item (admin only)', async () => {
      const admin = await createTestAdmin();
      const headers = getAuthHeaders(admin);
      
      const response = await request(app)
        .post('/api/menu')
        .set(headers)
        .send({
          name: 'New Item',
          category: 'Food',
          price: 75,
          stock: 20,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.item).toBeDefined();
    });
  });
  
  describe('MongoDB Database', () => {
    beforeEach(() => {
      expect(process.env.MONGO_URI).toBeDefined();
      RepositoryFactory.clearCache();
    });
    
    test('GET /api/menu - should list menu items', async () => {
      const menuRepo = RepositoryFactory.getMenuRepository();
      await menuRepo.create({ name: 'Item 1', category: 'Food', price: 50, stock: 10 });
      
      const response = await request(app)
        .get('/api/menu');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    test('POST /api/menu - should create menu item (admin only)', async () => {
      const admin = await createTestAdmin();
      const headers = getAuthHeaders(admin);
      
      const response = await request(app)
        .post('/api/menu')
        .set(headers)
        .send({
          name: 'New Item',
          category: 'Food',
          price: 75,
          stock: 20,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.item).toBeDefined();
    });
  });
});

