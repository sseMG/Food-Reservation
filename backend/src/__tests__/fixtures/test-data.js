/**
 * Test data fixtures for consistent test data
 */

const testUsers = {
  student: {
    name: 'Test Student',
    email: 'student@test.com',
    passwordHash: '$2a$10$rQZ8XK9J5L4M3N2O1P0Q9uVwXyZaBcDeFgHiJkLmNoPqRsTuVwXy',
    role: 'student',
    balance: 500,
    studentId: '123456789',
    phone: '1234567890',
  },
  admin: {
    name: 'Test Admin',
    email: 'admin@test.com',
    passwordHash: '$2a$10$rQZ8XK9J5L4M3N2O1P0Q9uVwXyZaBcDeFgHiJkLmNoPqRsTuVwXy',
    role: 'admin',
    balance: 0,
    studentId: '000000001',
    phone: '0987654321',
  },
};

const testMenuItems = {
  burger: {
    name: 'Burger',
    category: 'Food',
    price: 100,
    stock: 50,
    visible: true,
  },
  drink: {
    name: 'Coke',
    category: 'Beverage',
    price: 30,
    stock: 100,
    visible: true,
  },
};

const testReservations = {
  pending: {
    items: [{ id: 'item1', name: 'Burger', price: 100, qty: 2 }],
    total: 200,
    status: 'Pending',
    when: '12:00 PM',
    grade: '12',
    section: 'A',
  },
};

module.exports = {
  testUsers,
  testMenuItems,
  testReservations,
};

