# Repository Pattern Implementation

This document explains the Repository Pattern implementation in the Food Reservation backend.

## Overview

The Repository Pattern abstracts data access logic, allowing the application to switch between different database backends (JSON file database and MongoDB) without changing controller code.

## Architecture

### Base Repository

All repositories extend `BaseRepository` which defines common CRUD operations:

- `findById(id)` - Find a document by ID
- `findAll(query)` - Find all documents matching query
- `findOne(query)` - Find one document matching query
- `create(data)` - Create a new document
- `update(id, data)` - Update a document
- `delete(id)` - Delete a document
- `count(query)` - Count documents matching query

### Repository Implementations

#### JSON Repositories (`src/repositories/json/`)

- `user.repository.js`
- `menu.repository.js`
- `reservation.repository.js`
- `topup.repository.js`
- `transaction.repository.js`
- `notification.repository.js`
- `wallet.repository.js`
- `cart.repository.js`

These repositories use the file-based JSON database (`src/data/db.json`).

#### MongoDB Repositories (`src/repositories/mongodb/`)

Same structure as JSON repositories, but use MongoDB collections via Mongoose.

### Repository Factory

The `RepositoryFactory` automatically detects which database is available and returns the appropriate repository:

```javascript
const RepositoryFactory = require('./repositories/repository.factory');

// Automatically uses MongoDB if connected, otherwise JSON
const userRepo = RepositoryFactory.getUserRepository();
const menuRepo = RepositoryFactory.getMenuRepository();
```

## Usage in Controllers

Controllers use repositories instead of direct database access:

```javascript
const RepositoryFactory = require('../repositories/repository.factory');

exports.list = async (req, res) => {
  try {
    const menuRepo = RepositoryFactory.getMenuRepository();
    const items = await menuRepo.findAll({ includeDeleted: req.query.includeDeleted });
    res.json({ status: 200, data: items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list menu' });
  }
};
```

## Adding a New Repository

1. **Create JSON Repository** (`src/repositories/json/entity.repository.js`):

```javascript
const BaseRepository = require('../base.repository');
const { load, save } = require('../../lib/db');

class JsonEntityRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'entities';
  }

  async findAll(query = {}) {
    const db = await load();
    let entities = Array.isArray(db[this.collectionName]) ? db[this.collectionName] : [];
    // Apply filters...
    return entities;
  }

  // Implement other methods...
}

module.exports = new JsonEntityRepository();
```

2. **Create MongoDB Repository** (`src/repositories/mongodb/entity.repository.js`):

```javascript
const BaseRepository = require('../base.repository');
const mongoose = require('mongoose');
const { normalizeMongoDoc, sanitizeForResponse } = require('../utils/normalize');

class MongoEntityRepository extends BaseRepository {
  constructor() {
    super();
    this.collectionName = 'entities';
  }

  getCollection() {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    return mongoose.connection.db.collection(this.collectionName);
  }

  async findAll(query = {}) {
    const col = this.getCollection();
    const docs = await col.find(query).toArray();
    return docs.map(doc => sanitizeForResponse(normalizeMongoDoc(doc)));
  }

  // Implement other methods...
}

module.exports = new MongoEntityRepository();
```

3. **Add to Repository Factory** (`src/repositories/repository.factory.js`):

```javascript
static getEntityRepository() {
  const key = 'entity';
  if (repositoryCache[key]) return repositoryCache[key];
  
  if (usingMongo()) {
    repositoryCache[key] = require('./mongodb/entity.repository');
  } else {
    repositoryCache[key] = require('./json/entity.repository');
  }
  return repositoryCache[key];
}
```

## Adding a New Database Backend

To add support for a new database (e.g., PostgreSQL, MySQL):

1. Create repository implementations in `src/repositories/newdb/`
2. Update `RepositoryFactory` to detect and use the new database
3. Ensure all repositories implement the `BaseRepository` interface

## Data Normalization

The `normalize.js` utility handles conversion between JSON and MongoDB formats:

- `normalizeMongoDoc(doc)` - Converts MongoDB `_id` to `id`
- `sanitizeForResponse(doc)` - Removes MongoDB-specific fields
- `createIdFilter(id)` - Creates query filter for both `id` and `_id`

## Benefits

1. **Database Agnostic**: Controllers don't know which database is being used
2. **Easy Testing**: Can test with in-memory databases or mocks
3. **Maintainability**: Database logic is centralized in repositories
4. **Flexibility**: Easy to add new database backends
5. **Consistency**: Standardized interface across all data access

## Testing

Tests are written for both JSON and MongoDB implementations:

- Unit tests: `src/__tests__/repositories/json/` and `src/__tests__/repositories/mongodb/`
- Integration tests: `src/__tests__/routes/`

Each test runs with both database backends to ensure compatibility.

