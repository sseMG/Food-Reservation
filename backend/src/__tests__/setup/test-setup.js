const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load .env file if it exists (system env vars take precedence)
const envPath = path.join(__dirname, '..', '..', '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath, override: false });
}

let mongoServer;
let originalMongoUri;

// Setup MongoDB in-memory server for all tests
// Tests can delete MONGO_URI in beforeEach to use JSON mode
beforeAll(async () => {
  // Store original MONGO_URI if it exists
  originalMongoUri = process.env.MONGO_URI;
  
  // If MONGO_URI is not set, create in-memory MongoDB
  if (!process.env.MONGO_URI) {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;
    
    // Connect to in-memory MongoDB
    await mongoose.connect(mongoUri);
  } else {
    // Connect to provided MongoDB URI
    await mongoose.connect(process.env.MONGO_URI);
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Stop in-memory MongoDB if we created it
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  // Restore original MONGO_URI
  if (originalMongoUri) {
    process.env.MONGO_URI = originalMongoUri;
  } else {
    delete process.env.MONGO_URI;
  }
});

// Cleanup between tests
afterEach(async () => {
  // Clear repository cache first
  const RepositoryFactory = require('../../repositories/repository.factory');
  RepositoryFactory.clearCache();
  
  // Clear all collections between tests (if MongoDB is connected)
  // Only do this if MONGO_URI is set (MongoDB tests)
  if (process.env.MONGO_URI && mongoose.connection.readyState === 1) {
    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        try {
          await collections[key].deleteMany({});
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
    } catch (err) {
      // Ignore errors if database is being dropped
    }
  }
  
  // Restore MONGO_URI if it was deleted (for MongoDB tests)
  if (!process.env.MONGO_URI && (originalMongoUri || mongoServer)) {
    process.env.MONGO_URI = originalMongoUri || (mongoServer ? mongoServer.getUri() : undefined);
  }
});

