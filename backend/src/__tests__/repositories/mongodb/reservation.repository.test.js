const RepositoryFactory = require('../../../repositories/repository.factory');

describe('Reservation Repository - MongoDB', () => {
  beforeEach(async () => {
    expect(process.env.MONGO_URI).toBeDefined();
    RepositoryFactory.clearCache();
    
    // Clean up reservations created in previous tests
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.collection('reservations').deleteMany({});
    }
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
    
    const found = await reservationRepo.findById(created.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(created.id);
  });
  
  test('should find reservations by user id', async () => {
    const reservationRepo = RepositoryFactory.getReservationRepository();
    await reservationRepo.create({ userId: 'user1', items: [], total: 50 });
    await reservationRepo.create({ userId: 'user1', items: [], total: 75 });
    await reservationRepo.create({ userId: 'user2', items: [], total: 100 });
    
    const userReservations = await reservationRepo.findAll({ userId: 'user1' });
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

