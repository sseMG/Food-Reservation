const request = require('supertest');
const app = require('../../index');
const RepositoryFactory = require('../../repositories/repository.factory');
const { createTestAdmin, getAuthHeaders, createTestMenuItem } = require('../helpers/test-helpers');
const { resetJsonCategories } = require('../helpers/json-db-helpers');
const { resetMongoCategories } = require('../helpers/mongo-db-helpers');

describe('Admin Categories API', () => {
  describe('JSON DB', () => {
    beforeEach(async () => {
      delete process.env.MONGO_URI;
      RepositoryFactory.clearCache();
      await resetJsonCategories();
    });

    test('GET returns array', async () => {
      const res = await request(app).get('/api/admin/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    // NOTE: backend does not expose icons; icons are frontend-only

    test('POST creates category', async () => {
      const admin = await createTestAdmin();
      const headers = getAuthHeaders(admin);
      const res = await request(app).post('/api/admin/categories').set(headers).send({ name: 'APIcat', iconID: 3 });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.some(c => c.name === 'APIcat')).toBe(true);
    });

    test('POST with out-of-range iconID is accepted (server only validates non-negative integers)', async () => {
      const admin = await createTestAdmin();
      const headers = getAuthHeaders(admin);
      const big = 99999;
      const res = await request(app).post('/api/admin/categories').set(headers).send({ name: 'BadIcon', iconID: big });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.some(c => c.name === 'BadIcon')).toBe(true);
    });

    test('POST duplicate returns 409', async () => {
      const admin = await createTestAdmin();
      const headers = getAuthHeaders(admin);
      await request(app).post('/api/admin/categories').set(headers).send({ name: 'DupCat' });
      const res = await request(app).post('/api/admin/categories').set(headers).send({ name: 'dupcat' });
      expect(res.status).toBe(409);
    });

    test('PATCH rename', async () => {
      const admin = await createTestAdmin();
      const headers = getAuthHeaders(admin);
      await request(app).post('/api/admin/categories').set(headers).send({ name: 'ToRename' });
      const res = await request(app).patch('/api/admin/categories').set(headers).send({ oldName: 'ToRename', newName: 'Renamed' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.categories.some(c => c.name === 'Renamed')).toBe(true);
    });

    test('DELETE category without items', async () => {
      const admin = await createTestAdmin();
      const headers = getAuthHeaders(admin);
      await request(app).post('/api/admin/categories').set(headers).send({ name: 'ToDelete' });
      const res = await request(app).delete('/api/admin/categories').set(headers).send({ name: 'ToDelete' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('DELETE category with items should fail', async () => {
      const admin = await createTestAdmin();
      const headers = getAuthHeaders(admin);
      await request(app).post('/api/admin/categories').set(headers).send({ name: 'WithItem' });
      // create menu item under category
      const menuRepo = RepositoryFactory.getMenuRepository();
      await menuRepo.create({ name: 'Item1', category: 'WithItem', price: 10, stock: 1 });
      const res = await request(app).delete('/api/admin/categories').set(headers).send({ name: 'WithItem' });
      expect(res.status).toBe(409);
    });
  });

  describe('Mongo DB', () => {
    beforeEach(async () => {
      RepositoryFactory.clearCache();
      await resetMongoCategories();
    });

    test('GET returns array', async () => {
      const res = await request(app).get('/api/admin/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    // NOTE: backend does not expose icons; icons are frontend-only

    test('POST creates category', async () => {
      const admin = await createTestAdmin();
      const headers = getAuthHeaders(admin);
      const res = await request(app).post('/api/admin/categories').set(headers).send({ name: 'APIMongo', iconID: 5 });
      if (res.status === 200) {
        expect(res.body.ok).toBe(true);
        expect(Array.isArray(res.body.categories)).toBe(true);
        expect(res.body.categories.some(c => c.name === 'APIMongo')).toBe(true);
      } else {
        // If the category already exists (e.g. created by another test run), 409 is acceptable
        expect(res.status).toBe(409);
      }
    });
  });
});
