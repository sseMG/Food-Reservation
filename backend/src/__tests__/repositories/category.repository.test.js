const RepositoryFactory = require('../../repositories/repository.factory');

describe('Category Repository (JSON & Mongo)', () => {
  describe('JSON repository', () => {
    beforeEach(() => {
      // Force JSON repo
      delete process.env.MONGO_URI;
      RepositoryFactory.clearCache();
    });

    test('create and findAll returns object shape', async () => {
      const repo = RepositoryFactory.getCategoryRepository();
      const c = await repo.create({ name: 'TestCat' });
      expect(c).toHaveProperty('name', 'TestCat');
      expect(typeof c.iconID).toBe('number');

      const all = await repo.findAll();
      expect(Array.isArray(all)).toBe(true);
      expect(all.some(x => x.name === 'TestCat')).toBe(true);
    });

    // backend only validates iconID is a non-negative integer; out-of-range is allowed

    test('prevent duplicates', async () => {
      const repo = RepositoryFactory.getCategoryRepository();
      const a = await repo.create({ name: 'Dup' });
      const b = await repo.create({ name: 'dup' });
      expect(a.iconID).toBeDefined();
      expect(b.iconID).toBe(a.iconID);
    });

    test('rename and delete', async () => {
      const repo = RepositoryFactory.getCategoryRepository();
      await repo.create({ name: 'OldName' });
      const renamed = await repo.rename('OldName', 'NewName');
      expect(renamed).toBe('NewName');

      const deleted = await repo.delete('NewName');
      expect(deleted).toBe(true);
    });

    test('ensureDefaults reserves iconIDs 0..2', async () => {
      const repo = RepositoryFactory.getCategoryRepository();
      const defaults = ['Meals', 'Snacks', 'Beverages'];
      const got = await repo.ensureDefaults(defaults);
      expect(got.find(c => c.name === 'Meals').iconID).toBe(0);
      expect(got.find(c => c.name === 'Snacks').iconID).toBe(1);
      expect(got.find(c => c.name === 'Beverages').iconID).toBe(2);
    });
  });

  describe('Mongo repository', () => {
    beforeEach(() => {
      // Ensure Mongo repo is used
      // test-setup.js will set MONGO_URI or in-memory mongo
      RepositoryFactory.clearCache();
    });

    test('create, findAll return shape', async () => {
      expect(process.env.MONGO_URI).toBeDefined();
      const repo = RepositoryFactory.getCategoryRepository();
      const c = await repo.create({ name: 'TestCatMongo' });
      expect(c).toHaveProperty('name', 'TestCatMongo');
      expect(typeof c.iconID).toBe('number');

      const all = await repo.findAll();
      expect(Array.isArray(all)).toBe(true);
      expect(all.some(x => x.name === 'TestCatMongo')).toBe(true);
    });

    // backend only validates iconID is a non-negative integer; out-of-range is allowed in Mongo repo

    test('rename and delete', async () => {
      const repo = RepositoryFactory.getCategoryRepository();
      await repo.create({ name: 'OldMongo' });
      const renamed = await repo.rename('OldMongo', 'NewMongo');
      expect(renamed).toBe('NewMongo');

      const deleted = await repo.delete('NewMongo');
      expect(deleted).toBe(true);
    });

    test('ensureDefaults reserves iconIDs 0..2', async () => {
      const repo = RepositoryFactory.getCategoryRepository();
      const defaults = ['Meals', 'Snacks', 'Beverages'];
      const got = await repo.ensureDefaults(defaults);
      expect(got.find(c => c.name === 'Meals').iconID).toBe(0);
      expect(got.find(c => c.name === 'Snacks').iconID).toBe(1);
      expect(got.find(c => c.name === 'Beverages').iconID).toBe(2);
    });
  });
});
