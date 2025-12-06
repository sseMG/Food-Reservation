const mongoose = require('mongoose');

/**
 * Test-only helper: reset MongoDB categories collection in the in-memory test database.
 * Does NOT touch any real deployed MongoDB instance; it only operates on MongoMemoryServer
 * used by Jest via test-setup.js.
 */
async function resetMongoCategories() {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;

  // Try common collection names for categories
  const candidates = ['categories', 'food_categories'];
  for (const name of candidates) {
    const col = collections[name];
    if (col) {
      await col.deleteMany({});
    }
  }
}

module.exports = {
  resetMongoCategories,
};
