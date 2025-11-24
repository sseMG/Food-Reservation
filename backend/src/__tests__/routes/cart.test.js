const request = require('supertest');
const app = require('../../index');
const RepositoryFactory = require('../../repositories/repository.factory');
const { createTestUser, getAuthHeaders } = require('../helpers/test-helpers');

describe('Cart Routes', () => {
  describe('JSON Database', () => {
    beforeEach(() => {
      delete process.env.MONGO_URI;
      RepositoryFactory.clearCache();
    });
    
    test('GET /api/cart - should get user cart', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user);
      
      const response = await request(app)
        .get('/api/cart')
        .set(headers);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
    
    test('POST /api/cart/add - should add item to cart', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user);
      
      const response = await request(app)
        .post('/api/cart/add')
        .set(headers)
        .send({
          itemId: 'item1',
          qty: 2,
          name: 'Test Item',
          price: 50,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
    });
  });
  
  describe('MongoDB Database', () => {
    beforeEach(() => {
      expect(process.env.MONGO_URI).toBeDefined();
      RepositoryFactory.clearCache();
    });
    
    test('GET /api/cart - should get user cart', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user);
      
      const response = await request(app)
        .get('/api/cart')
        .set(headers);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
    
    test('POST /api/cart/add - should add item to cart', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user);
      
      const response = await request(app)
        .post('/api/cart/add')
        .set(headers)
        .send({
          itemId: 'item1',
          qty: 2,
          name: 'Test Item',
          price: 50,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
    });
  });
});

