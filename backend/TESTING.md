# Testing Guide

This document explains how to run tests for the Food Reservation backend.

## Test Structure

Tests are organized into:

- **Repository Tests**: `src/__tests__/repositories/`
  - JSON implementations: `json/*.test.js`
  - MongoDB implementations: `mongodb/*.test.js`
  
- **Route/Integration Tests**: `src/__tests__/routes/`
  - Tests for API endpoints with both database backends

- **Test Helpers**: `src/__tests__/helpers/test-helpers.js`
  - Utility functions for creating test data, authentication, etc.

## Running Tests

### Run All Tests

```bash
cd backend
npm test
```

### Run Tests for Specific Database

```bash
# JSON database tests only
npm test -- --testPathPattern=json

# MongoDB database tests only
npm test -- --testPathPattern=mongodb
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage reports are generated in `backend/coverage/`.

## Test Environment

Tests automatically detect which database to use:

- **JSON Database**: If `MONGO_URI` is not set, tests use the JSON file database
- **MongoDB Database**: If `MONGO_URI` is set, tests use MongoDB (in-memory for CI/CD)

## Test Setup

The test setup file (`src/__tests__/setup/test-setup.js`) automatically:

1. Starts an in-memory MongoDB instance for MongoDB tests
2. Connects to MongoDB if `MONGO_URI` is provided
3. Cleans up collections between tests
4. Clears repository cache between tests

## Writing Tests

### Example: Repository Test

```javascript
const RepositoryFactory = require('../../../repositories/repository.factory');

describe('Menu Repository - JSON', () => {
  beforeEach(() => {
    delete process.env.MONGO_URI;
    RepositoryFactory.clearCache();
  });
  
  test('should create a menu item', async () => {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const item = await menuRepo.create({
      name: 'Test Item',
      category: 'Food',
      price: 50,
    });
    
    expect(item).toBeDefined();
    expect(item.id).toBeDefined();
  });
});
```

### Example: Route Test

```javascript
const request = require('supertest');
const app = require('../../../src/index');
const { createTestUser, getAuthHeaders } = require('../helpers/test-helpers');

describe('Reservation Routes', () => {
  test('POST /api/reservations - should create a reservation', async () => {
    const user = await createTestUser();
    const headers = getAuthHeaders(user);
    
    const response = await request(app)
      .post('/api/reservations')
      .set(headers)
      .send({
        items: [{ id: 'item1', qty: 2 }],
        slot: '12:00 PM',
      });
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
  });
});
```

## CI/CD

GitHub Actions automatically runs tests on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

Tests run with:
- Node.js versions: 18.x and 20.x
- Database backends: JSON and MongoDB
- Coverage reports generated for MongoDB tests

## Test Coverage Goals

- Repository methods: 80%+
- Controller functions: 70%+
- Route handlers: 60%+

## Troubleshooting

### Tests Fail with MongoDB Connection Error

- Ensure `mongodb-memory-server` is installed: `npm install --save-dev mongodb-memory-server`
- Check that MongoDB tests are using in-memory server (automatic in CI/CD)

### Tests Fail with JSON Database

- Ensure `src/data/db.json` exists and is writable
- Check file permissions

### Repository Cache Issues

- Use `RepositoryFactory.clearCache()` in test `beforeEach` or `afterEach` hooks
- This ensures fresh repository instances for each test

