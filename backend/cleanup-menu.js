/**
 * Clean up dummy menu items and reset database
 * Run with: node cleanup-menu.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RepositoryFactory = require('./src/repositories/repository.factory');
const { load, save } = require('./src/lib/db');

async function cleanup() {
  console.log('🧹 Starting cleanup...\n');

  const usingMongo = !!process.env.MONGO_URI;

  if (usingMongo) {
    console.log('📊 Using MongoDB mode');
    await mongoose.connect(process.env.MONGO_URI);
    
    const menuRepo = RepositoryFactory.getMenuRepository();
    const allItems = await menuRepo.findAll({});
    
    console.log(`Found ${allItems.length} menu items`);
    
    // Delete all items (you can be selective here)
    for (const item of allItems) {
      console.log(`  - Deleting: ${item.name} (${item.id})`);
      await menuRepo.delete(item.id);
    }
    
    await mongoose.connection.close();
    console.log('\n✅ MongoDB menu cleaned!');
    
  } else {
    console.log('📁 Using JSON mode');
    const db = await load();
    
    console.log(`Found ${(db.menu || []).length} menu items`);
    
    // Clear menu
    db.menu = [];
    
    // Optionally clear reservations too
    // db.reservations = [];
    
    await save(db);
    console.log('\n✅ JSON menu cleaned!');
  }

  console.log('\n💡 Now you can add real menu items through:');
  console.log('   1. Admin panel: POST /api/admin/menu');
  console.log('   2. With actual food images uploaded\n');
}

cleanup().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
