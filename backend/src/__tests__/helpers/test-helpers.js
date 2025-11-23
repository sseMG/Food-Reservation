const bcrypt = require('bcryptjs');
const RepositoryFactory = require('../../repositories/repository.factory');

/**
 * Create a test user
 */
async function createTestUser(overrides = {}) {
  const userRepo = RepositoryFactory.getUserRepository();
  return await userRepo.create({
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'student',
    balance: 1000,
    studentId: String(Date.now()).slice(-9),
    phone: '1234567890',
    ...overrides,
  });
}

/**
 * Create a test admin user
 */
async function createTestAdmin(overrides = {}) {
  return await createTestUser({
    role: 'admin',
    email: `admin${Date.now()}@example.com`,
    ...overrides,
  });
}

/**
 * Create a test menu item
 */
async function createTestMenuItem(overrides = {}) {
  const menuRepo = RepositoryFactory.getMenuRepository();
  return await menuRepo.create({
    name: 'Test Item',
    category: 'Food',
    price: 50,
    stock: 100,
    visible: true,
    ...overrides,
  });
}

/**
 * Create a test reservation
 */
async function createTestReservation(userId, overrides = {}) {
  const reservationRepo = RepositoryFactory.getReservationRepository();
  return await reservationRepo.create({
    userId,
    student: 'Test Student',
    items: [{ id: 'item1', name: 'Item 1', price: 50, qty: 2 }],
    total: 100,
    status: 'Pending',
    when: '12:00 PM',
    ...overrides,
  });
}

/**
 * Get auth token for a user (simplified - in real tests, use actual JWT)
 */
function getAuthToken(user) {
  const jwt = require('jsonwebtoken');
  const SECRET = process.env.JWT_SECRET || 'dev_secret_key';
  return jwt.sign(
    { id: user.id, role: user.role || 'user', name: user.name },
    SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Create authenticated request headers
 */
function getAuthHeaders(user) {
  const token = getAuthToken(user);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  const mongoose = require('mongoose');
  const RepositoryFactory = require('../../repositories/repository.factory');
  RepositoryFactory.clearCache();
  
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

module.exports = {
  createTestUser,
  createTestAdmin,
  createTestMenuItem,
  createTestReservation,
  getAuthToken,
  getAuthHeaders,
  cleanupTestData,
};

