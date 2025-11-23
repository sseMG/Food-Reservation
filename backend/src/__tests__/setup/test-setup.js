const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Only setup MongoDB if MONGO_URI is set or if we're running MongoDB tests
const shouldSetupMongo = process.env.MONGO_URI || process.env.TEST_DB === 'mongodb';

if (shouldSetupMongo) {
  // Setup before all tests
  beforeAll(async () => {
    // If MONGO_URI is not set, use in-memory MongoDB
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
    
    // Only clear MONGO_URI if we set it
    if (!process.env.MONGO_URI || mongoServer) {
      delete process.env.MONGO_URI;
    }
  });

  // Cleanup between tests
  afterEach(async () => {
    // Clear all collections between tests
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
    
    // Clear repository cache
    const RepositoryFactory = require('../../repositories/repository.factory');
    RepositoryFactory.clearCache();
  });
} else {
  // For JSON database tests, just clear repository cache
  afterEach(async () => {
    const RepositoryFactory = require('../../repositories/repository.factory');
    RepositoryFactory.clearCache();
  });
}

