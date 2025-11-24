const RepositoryFactory = require('../../../repositories/repository.factory');
const { load, save } = require('../../../lib/db');

describe('Reservation Repository - JSON', () => {
  beforeEach(async () => {
    delete process.env.MONGO_URI;
    RepositoryFactory.clearCache();
    
    // Clean up reservations created in previous tests
    const db = await load();
    db.reservations = [];
    await save(db);
  });
  
  afterEach(async () => {
    // Additional cleanup after each test
    const db = await load();
    db.reservations = [];
    await save(db);
    RepositoryFactory.clearCache();
  });
  
  test('should create a reservation', async () => {
    const reservationRepo = RepositoryFactory.getReservationRepository();
    const reservation = await reservationRepo.create({
      userId: 'user1',
      student: 'Test Student',
      items: [{ id: 'item1', name: 'Item 1', price: 50, qty: 2 }],
      total: 100,
      status: 'Pending',
    });
    
    expect(reservation).toBeDefined();
    expect(reservation.id).toBeDefined();
    expect(reservation.total).toBe(100);
  });
  
  test('should find reservation by id', async () => {
    const reservationRepo = RepositoryFactory.getReservationRepository();
    const created = await reservationRepo.create({
      userId: 'user1',
      items: [],
      total: 50,
    });
    
    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    
    // Small delay to ensure database write is complete
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const found = await reservationRepo.findById(created.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(created.id);
  });
  
  test('should find reservations by user id', async () => {
    const reservationRepo = RepositoryFactory.getReservationRepository();
    
    // Use a unique userId for this test to avoid conflicts
    const testUserId = 'test_user_find_by_id';
    
    // Verify database is clean before creating reservations
    const beforeCreate = await reservationRepo.findAll({ userId: testUserId });
    expect(beforeCreate.length).toBe(0);
    
    await reservationRepo.create({ userId: testUserId, items: [], total: 50 });
    await reservationRepo.create({ userId: testUserId, items: [], total: 75 });
    await reservationRepo.create({ userId: 'test_user_other', items: [], total: 100 });
    
    // Small delay to ensure database writes are complete
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const userReservations = await reservationRepo.findAll({ userId: testUserId });
    expect(userReservations.length).toBe(2);
  });
  
  test('should update reservation', async () => {
    const reservationRepo = RepositoryFactory.getReservationRepository();
    const created = await reservationRepo.create({
      userId: 'user1',
      items: [],
      total: 50,
      status: 'Pending',
    });
    
    const updated = await reservationRepo.update(created.id, { status: 'Approved' });
    expect(updated.status).toBe('Approved');
  });
});

