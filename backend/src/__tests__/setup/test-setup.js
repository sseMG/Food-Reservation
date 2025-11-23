const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

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
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } else {
    // Connect to provided MongoDB URI
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close mongoose connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  
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
  // Clear all collections between tests (if MongoDB is connected)
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
  
  // Clear repository cache
  const RepositoryFactory = require('../../repositories/repository.factory');
  RepositoryFactory.clearCache();
  
  // Restore MONGO_URI if it was deleted (for MongoDB tests)
  if (!process.env.MONGO_URI && (originalMongoUri || mongoServer)) {
    process.env.MONGO_URI = originalMongoUri || (mongoServer ? mongoServer.getUri() : undefined);
  }
});

