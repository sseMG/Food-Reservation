/**
 * Delete specific items by ID
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RepositoryFactory = require('./src/repositories/repository.factory');

const IDS_TO_DELETE = [
  'ITM_1764938110539',
  'ITM_1764938162337'
];

async function deleteItems() {
  const usingMongo = !!process.env.MONGO_URI;
  if (usingMongo) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  const menuRepo = RepositoryFactory.getMenuRepository();

  for (const id of IDS_TO_DELETE) {
    try {
      await menuRepo.delete(id);
      console.log(`✅ Deleted: ${id}`);
    } catch (err) {
      console.log(`⚠️  Could not delete ${id}:`, err.message);
    }
  }

  if (usingMongo) {
    await mongoose.connection.close();
  }
  console.log('\n✅ Cleanup complete!');
}

deleteItems();
