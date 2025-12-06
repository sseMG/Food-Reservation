/**
 * Check what's currently in the menu database
 * Run with: node check-menu.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RepositoryFactory = require('./src/repositories/repository.factory');
const { load } = require('./src/lib/db');

async function check() {
  console.log('🔍 Checking menu database...\n');

  const usingMongo = !!process.env.MONGO_URI;

  if (usingMongo) {
    console.log('📊 Mode: MongoDB');
    console.log(`   URI: ${process.env.MONGO_URI}\n`);
    
    await mongoose.connect(process.env.MONGO_URI);
    
    const menuRepo = RepositoryFactory.getMenuRepository();
    const allItems = await menuRepo.findAll({});
    
    console.log(`Found ${allItems.length} menu items:\n`);
    
    if (allItems.length === 0) {
      console.log('   (empty)\n');
    } else {
      allItems.forEach((item, i) => {
        console.log(`${i + 1}. ${item.name}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Category: ${item.category}`);
        console.log(`   Price: ₱${item.price}`);
        console.log(`   Stock: ${item.stock}`);
        console.log(`   Image: ${item.imageUrl || '(no image)'}`);
        console.log(`   Visible: ${item.visible !== false}`);
        console.log('');
      });
    }
    
    await mongoose.connection.close();
    
  } else {
    console.log('📁 Mode: JSON');
    console.log(`   File: src/data/db.json\n`);
    
    const db = await load();
    const items = db.menu || [];
    
    console.log(`Found ${items.length} menu items:\n`);
    
    if (items.length === 0) {
      console.log('   (empty)\n');
    } else {
      items.forEach((item, i) => {
        console.log(`${i + 1}. ${item.name}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Category: ${item.category}`);
        console.log(`   Price: ₱${item.price}`);
        console.log(`   Stock: ${item.stock}`);
        console.log(`   Image: ${item.imageUrl || '(no image)'}`);
        console.log(`   Visible: ${item.visible !== false}`);
        console.log('');
      });
    }
  }

  console.log('✅ Check complete!\n');
}

check().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
