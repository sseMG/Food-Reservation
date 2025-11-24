const RepositoryFactory = require('../../../repositories/repository.factory');
const { load, save } = require('../../../lib/db');

describe('Menu Repository - JSON', () => {
  beforeEach(async () => {
    delete process.env.MONGO_URI;
    RepositoryFactory.clearCache();
    
    // Clean up menu items created in previous tests
    const db = await load();
    db.menu = [];
    await save(db);
  });
  
  test('should create a menu item', async () => {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const item = await menuRepo.create({
      name: 'Test Item',
      category: 'Food',
      price: 50,
      stock: 10,
    });
    
    expect(item).toBeDefined();
    expect(item.id).toBeDefined();
    expect(item.name).toBe('Test Item');
    expect(item.price).toBe(50);
  });
  
  test('should find menu item by id', async () => {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const created = await menuRepo.create({
      name: 'Find Item',
      category: 'Food',
      price: 75,
    });
    
    const found = await menuRepo.findById(created.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(created.id);
    expect(found.name).toBe('Find Item');
  });
  
  test('should list all menu items', async () => {
    const menuRepo = RepositoryFactory.getMenuRepository();
    await menuRepo.create({ name: 'Item 1', category: 'Food', price: 50 });
    await menuRepo.create({ name: 'Item 2', category: 'Drink', price: 30 });
    
    const items = await menuRepo.findAll({});
    expect(items.length).toBeGreaterThanOrEqual(2);
  });
  
  test('should update menu item', async () => {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const created = await menuRepo.create({
      name: 'Update Item',
      category: 'Food',
      price: 50,
    });
    
    const updated = await menuRepo.update(created.id, { price: 75 });
    expect(updated).toBeDefined();
    expect(updated.price).toBe(75);
  });
  
  test('should soft delete menu item', async () => {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const created = await menuRepo.create({
      name: 'Delete Item',
      category: 'Food',
      price: 50,
    });
    
    // Verify item was created
    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    
    const result = await menuRepo.delete(created.id);
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.deleted).toBe(true);
    expect(result.visible).toBe(false);
    
    const found = await menuRepo.findById(created.id);
    expect(found).toBeDefined();
    expect(found.deleted).toBe(true);
    expect(found.visible).toBe(false);
  });
  
  test('should increment stock', async () => {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const created = await menuRepo.create({
      name: 'Stock Item',
      category: 'Food',
      price: 50,
      stock: 10,
    });
    
    const updated = await menuRepo.incrementStock(created.id, 5);
    expect(updated.stock).toBe(15);
  });
  
  test('should decrement stock', async () => {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const created = await menuRepo.create({
      name: 'Stock Item',
      category: 'Food',
      price: 50,
      stock: 10,
    });
    
    const updated = await menuRepo.decrementStock(created.id, 3);
    expect(updated.stock).toBe(7);
  });
});

