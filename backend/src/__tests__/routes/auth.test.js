const request = require('supertest');
const app = require('../../index');
const RepositoryFactory = require('../../repositories/repository.factory');

describe('Auth Routes', () => {
  describe('JSON Database', () => {
    beforeEach(() => {
      // Force JSON database by removing MONGO_URI and clearing cache
      delete process.env.MONGO_URI;
      RepositoryFactory.clearCache();
    });

    test('JSON DB - register -> approve -> login -> me -> logout -> invalid logins', async () => {
      const email = `newuser-json-${Date.now()}@example.com`;
      const password = 'password123';
      const studentId = String(Date.now()).slice(-9);
      const phone = '1234567890';

      // 1) register
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email, password, studentId, phone });

      expect(registerRes.status).toBe(200);
      expect(registerRes.body.ok).toBe(true);

      // 2) approve directly via repository
      const userRepo = RepositoryFactory.getUserRepository();
      const created = await userRepo.findOne({ email });
      expect(created).toBeTruthy();
      expect(created.status).toBe('pending');

      const updated = await userRepo.update(created.id, { status: 'approved' });
      expect(updated.status).toBe('approved');

      // 3) login with correct credentials
      const loginRes = await request(app).post('/api/auth/login').send({ email, password });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.status).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();
      expect(loginRes.body.data.user).toBeDefined();

      const token = loginRes.body.data.token;
      const authHeader = { Authorization: `Bearer ${token}` };

      // 4) /api/auth/me
      const meRes = await request(app).get('/api/auth/me').set(authHeader);
      expect(meRes.status).toBe(200);
      expect(meRes.body.status).toBe(200);
      expect(meRes.body.data.id).toBe(updated.id);
      expect(meRes.body.data.password).toBeUndefined();
      expect(meRes.body.data.passwordHash).toBeUndefined();

      // 5) logout
      const logoutRes = await request(app).post('/api/auth/logout').set(authHeader).send();
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.ok).toBe(true);

      // 6) login with wrong password
      const wrongPass = await request(app).post('/api/auth/login').send({ email, password: 'wrongpass' });
      expect(wrongPass.status).toBe(401);

      // 7) login with wrong email
      const wrongEmail = await request(app).post('/api/auth/login').send({ email: `wrong-${email}`, password });
      expect(wrongEmail.status).toBe(401);
    }, 20000);
  });

  describe('MongoDB Database', () => {
    beforeEach(() => {
      // MongoDB URI should be set by test-setup.js
      expect(process.env.MONGO_URI).toBeDefined();
      RepositoryFactory.clearCache();
    });

    test('Mongo DB - register -> approve -> login -> me -> logout -> invalid logins', async () => {
      const email = `newuser-mongo-${Date.now()}@example.com`;
      const password = 'password123';
      const studentId = String(Date.now()).slice(-9);
      const phone = '1234567890';

      // 1) register
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email, password, studentId, phone });

      expect(registerRes.status).toBe(200);
      expect(registerRes.body.ok).toBe(true);

      // 2) approve directly via repository
      const userRepo = RepositoryFactory.getUserRepository();
      const created = await userRepo.findOne({ email });
      expect(created).toBeTruthy();
      expect(created.status).toBe('pending');

      const updated = await userRepo.update(created.id, { status: 'approved' });
      expect(updated.status).toBe('approved');

      // 3) login with correct credentials
      const loginRes = await request(app).post('/api/auth/login').send({ email, password });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.status).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();
      expect(loginRes.body.data.user).toBeDefined();

      const token = loginRes.body.data.token;
      const authHeader = { Authorization: `Bearer ${token}` };

      // 4) /api/auth/me
      const meRes = await request(app).get('/api/auth/me').set(authHeader);
      expect(meRes.status).toBe(200);
      expect(meRes.body.status).toBe(200);
      expect(meRes.body.data.id).toBe(updated.id);
      expect(meRes.body.data.password).toBeUndefined();
      expect(meRes.body.data.passwordHash).toBeUndefined();

      // 5) logout
      const logoutRes = await request(app).post('/api/auth/logout').set(authHeader).send();
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.ok).toBe(true);

      // 6) login with wrong password
      const wrongPass = await request(app).post('/api/auth/login').send({ email, password: 'wrongpass' });
      expect(wrongPass.status).toBe(401);

      // 7) login with wrong email
      const wrongEmail = await request(app).post('/api/auth/login').send({ email: `wrong-${email}`, password });
      expect(wrongEmail.status).toBe(401);
    }, 20000);
  });
});

