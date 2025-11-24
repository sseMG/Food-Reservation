# Migration to Repository Pattern

This document describes the migration from direct database access to the Repository Pattern.

## Changes Made

### 1. Repository Infrastructure

- Created `BaseRepository` abstract class
- Created JSON repository implementations for all entities
- Created MongoDB repository implementations for all entities
- Created `RepositoryFactory` for automatic database detection
- Created normalization utilities for data consistency

### 2. Controller Refactoring

All 13 controllers were refactored to use repositories:

- `auth.controller.js` - Uses `UserRepository`
- `menu.controller.js` - Uses `MenuRepository`
- `reservations.controller.js` - Uses `ReservationRepository`, `MenuRepository`, `UserRepository`, `TransactionRepository`
- `topups.controller.js` - Uses `TopupRepository`, `UserRepository`, `TransactionRepository`
- `transactions.controller.js` - Uses `TransactionRepository`, `ReservationRepository`
- `wallets.controller.js` - Uses `WalletRepository`, `UserRepository`
- `password.controller.js` - Uses `UserRepository`
- `notifications.controller.js` - Uses `NotificationRepository`, `UserRepository`
- `admin.controller.js` - Uses `MenuRepository`, `ReservationRepository`, `UserRepository`
- `admin.users.controller.js` - Uses `UserRepository`, `NotificationRepository`
- `cart.controller.js` - Uses `CartRepository`
- `reports.controller.js` - Uses `ReservationRepository`, `MenuRepository`
- `inventory.controller.js` - Uses `MenuRepository`

### 3. Testing Infrastructure

- Added Jest, Supertest, and mongodb-memory-server
- Created test setup and helpers
- Created unit tests for repositories
- Created integration tests for routes
- Set up GitHub Actions CI/CD

## Breaking Changes

**None** - All API endpoints remain unchanged. The refactoring is internal only.

## Migration Steps

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Start server** (works with both JSON and MongoDB):
   ```bash
   # With MongoDB (if MONGO_URI is set)
   MONGO_URI=mongodb://localhost:27017/food-reservation npm start

   # Without MongoDB (uses JSON file)
   npm start
   ```

## Rollback Procedure

If issues arise, you can rollback by:

1. Revert controller changes to use direct database access
2. Keep repository files for future use
3. The old code pattern is preserved in git history

## Benefits Achieved

1. **Reduced Code Duplication**: Database logic centralized in repositories
2. **Easier Testing**: Can test with different database backends
3. **Better Maintainability**: Changes to database logic only need to be made in one place
4. **Future-Proof**: Easy to add new database backends

## Performance Considerations

- Repository pattern adds minimal overhead (one function call)
- MongoDB repositories use native MongoDB driver for optimal performance
- JSON repositories use existing file I/O operations
- No performance degradation observed in testing

## Known Limitations

1. **Transactions**: JSON database doesn't support true transactions (operations are atomic per file write)
2. **Complex Queries**: Some MongoDB aggregation pipelines are simplified in JSON implementation
3. **ID Normalization**: MongoDB uses `_id` internally but exposes as `id` for consistency

## Future Enhancements

1. Add caching layer to repositories
2. Add query builder for complex queries
3. Add support for PostgreSQL/MySQL
4. Add repository-level validation
5. Add audit logging to repositories

