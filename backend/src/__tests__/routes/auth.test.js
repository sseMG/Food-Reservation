const request = require('supertest');
const app = require('../../index');
const RepositoryFactory = require('../../repositories/repository.factory');
const { createTestUser, getAuthHeaders } = require('../helpers/test-helpers');

describe('Auth Routes', () => {
  describe('JSON Database', () => {
    beforeEach(() => {
      delete process.env.MONGO_URI;
      RepositoryFactory.clearCache();
    });
    
    test('POST /api/auth/register - should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: `newuser${Date.now()}@example.com`,
          password: 'password123',
          studentId: String(Date.now()).slice(-9),
          phone: '1234567890',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
    
    test('POST /api/auth/login - should login with valid credentials', async () => {
      const userRepo = RepositoryFactory.getUserRepository();
      const user = await userRepo.create({
        name: 'Login User',
        email: 'login@example.com',
        passwordHash: require('bcryptjs').hashSync('password123', 10),
        role: 'student',
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });
    
    test('GET /api/auth/me - should get current user', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user);
      
      const response = await request(app)
        .get('/api/auth/me')
        .set(headers);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(response.body.data.id).toBe(user.id);
    });
  });
  
  describe('MongoDB Database', () => {
    beforeEach(() => {
      // MONGO_URI should be set by test-setup.js
      expect(process.env.MONGO_URI).toBeDefined();
      RepositoryFactory.clearCache();
    });
    
    test('POST /api/auth/register - should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: `newuser${Date.now()}@example.com`,
          password: 'password123',
          studentId: String(Date.now()).slice(-9),
          phone: '1234567890',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
    
    test('POST /api/auth/login - should login with valid credentials', async () => {
      const userRepo = RepositoryFactory.getUserRepository();
      const user = await userRepo.create({
        name: 'Login User',
        email: 'login@example.com',
        passwordHash: require('bcryptjs').hashSync('password123', 10),
        role: 'student',
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });
    
    test('GET /api/auth/me - should get current user', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user);
      
      const response = await request(app)
        .get('/api/auth/me')
        .set(headers);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(response.body.data.id).toBe(user.id);
    });
  });
});

