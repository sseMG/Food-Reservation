/**
 * Add ONE specific test item for overselling test
 * Run with: node add-test-burger.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RepositoryFactory = require('./src/repositories/repository.factory');

async function addTestItem() {
  console.log('🍔 Adding test burger for overselling test...\n');

  const usingMongo = !!process.env.MONGO_URI;

  if (usingMongo) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  const menuRepo = RepositoryFactory.getMenuRepository();

  const testItem = {
    name: 'Overselling Test Burger',
    category: 'Meals',
    price: 100,
    stock: 5,  // LOW STOCK for testing
    description: 'Use this burger to test overselling protection. Only 5 in stock!',
    visible: true
  };

  try {
    const created = await menuRepo.create(testItem);
    console.log('✅ Test item created!');
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  USE THIS ID FOR TESTING:                  ║');
    console.log(`║  ${created.id}                 ║`);
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log(`Name: ${created.name}`);
    console.log(`Price: ₱${created.price}`);
    console.log(`Stock: ${created.stock} ← Only 5 available!`);
    console.log('');
    console.log('📋 COPY THIS LINE FOR BROWSER TEST:');
    console.log('─────────────────────────────────────────────');
    console.log(`const ITEM_ID = '${created.id}';`);
    console.log('─────────────────────────────────────────────');
  } catch (err) {
    console.error('❌ Failed to create test item:', err.message);
  }

  if (usingMongo) {
    await mongoose.connection.close();
  }
}

addTestItem().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
