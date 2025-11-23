const request = require('supertest');
const app = require('../../../src/index');
const RepositoryFactory = require('../../../repositories/repository.factory');
const { createTestUser, createTestMenuItem, getAuthHeaders } = require('../helpers/test-helpers');

describe('Reservation Routes', () => {
  describe('JSON Database', () => {
    beforeEach(() => {
      delete process.env.MONGO_URI;
      RepositoryFactory.clearCache();
    });
    
    test('POST /api/reservations - should create a reservation', async () => {
      const user = await createTestUser();
      const menuItem = await createTestMenuItem();
      const headers = getAuthHeaders(user);
      
      const response = await request(app)
        .post('/api/reservations')
        .set(headers)
        .send({
          items: [{ id: menuItem.id, qty: 2 }],
          slot: '12:00 PM',
          grade: '12',
          section: 'A',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBeDefined();
      expect(response.body.total).toBeDefined();
    });
    
    test('GET /api/reservations/mine - should get user reservations', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user);
      
      const response = await request(app)
        .get('/api/reservations/mine')
        .set(headers);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
  
  describe('MongoDB Database', () => {
    beforeEach(() => {
      expect(process.env.MONGO_URI).toBeDefined();
      RepositoryFactory.clearCache();
    });
    
    test('POST /api/reservations - should create a reservation', async () => {
      const user = await createTestUser();
      const menuItem = await createTestMenuItem();
      const headers = getAuthHeaders(user);
      
      const response = await request(app)
        .post('/api/reservations')
        .set(headers)
        .send({
          items: [{ id: menuItem.id, qty: 2 }],
          slot: '12:00 PM',
          grade: '12',
          section: 'A',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBeDefined();
      expect(response.body.total).toBeDefined();
    });
    
    test('GET /api/reservations/mine - should get user reservations', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user);
      
      const response = await request(app)
        .get('/api/reservations/mine')
        .set(headers);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

