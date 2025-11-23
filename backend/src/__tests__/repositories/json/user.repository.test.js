const RepositoryFactory = require('../../../repositories/repository.factory');
const fs = require('fs');
const path = require('path');

describe('User Repository - JSON', () => {
  const testDbPath = path.join(__dirname, '../../../data/test-db.json');
  let originalDbPath;
  let originalLoad;
  
  beforeAll(() => {
    // Backup original db path
    const dbModule = require('../../../lib/db');
    originalLoad = dbModule.load;
    
    // Create test database
    const testDb = { users: [], menu: [], reservations: [], topups: [], transactions: [], notifications: [] };
    fs.writeFileSync(testDbPath, JSON.stringify(testDb, null, 2));
  });
  
  afterAll(() => {
    // Cleanup test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  beforeEach(() => {
    // Clear repository cache
    RepositoryFactory.clearCache();
    // Ensure MONGO_URI is not set to force JSON mode
    delete process.env.MONGO_URI;
  });
  
  test('should create a user', async () => {
    const userRepo = RepositoryFactory.getUserRepository();
    const user = await userRepo.create({
      name: 'Test User',
      email: 'test@example.com',
      role: 'student',
    });
    
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
  });
  
  test('should find user by id', async () => {
    const userRepo = RepositoryFactory.getUserRepository();
    const created = await userRepo.create({
      name: 'Find User',
      email: 'find@example.com',
    });
    
    const found = await userRepo.findById(created.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(created.id);
    expect(found.name).toBe('Find User');
  });
  
  test('should find user by email', async () => {
    const userRepo = RepositoryFactory.getUserRepository();
    await userRepo.create({
      name: 'Email User',
      email: 'email@example.com',
    });
    
    const found = await userRepo.findOne({ email: 'email@example.com' });
    expect(found).toBeDefined();
    expect(found.email).toBe('email@example.com');
  });
  
  test('should update user', async () => {
    const userRepo = RepositoryFactory.getUserRepository();
    const created = await userRepo.create({
      name: 'Update User',
      email: 'update@example.com',
    });
    
    const updated = await userRepo.update(created.id, { name: 'Updated Name' });
    expect(updated).toBeDefined();
    expect(updated.name).toBe('Updated Name');
    expect(updated.email).toBe('update@example.com');
  });
  
  test('should delete user', async () => {
    const userRepo = RepositoryFactory.getUserRepository();
    const created = await userRepo.create({
      name: 'Delete User',
      email: 'delete@example.com',
    });
    
    const result = await userRepo.delete(created.id);
    expect(result).toBe(true);
    
    const found = await userRepo.findById(created.id);
    expect(found).toBeNull();
  });
  
  test('should increment balance', async () => {
    const userRepo = RepositoryFactory.getUserRepository();
    const created = await userRepo.create({
      name: 'Balance User',
      email: 'balance@example.com',
      balance: 100,
    });
    
    const updated = await userRepo.incrementBalance(created.id, 50);
    expect(updated.balance).toBe(150);
  });
  
  test('should decrement balance', async () => {
    const userRepo = RepositoryFactory.getUserRepository();
    const created = await userRepo.create({
      name: 'Balance User',
      email: 'balance2@example.com',
      balance: 100,
    });
    
    const updated = await userRepo.decrementBalance(created.id, 30);
    expect(updated.balance).toBe(70);
  });
});

