/**
 * Add sample menu items with proper structure
 * Run with: node add-sample-menu.js
 * 
 * NOTE: This adds items WITHOUT images. To add images:
 * 1. Use the admin panel UI to upload images
 * 2. Or use the API endpoint with multipart/form-data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RepositoryFactory = require('./src/repositories/repository.factory');
const { load, save } = require('./src/lib/db');

const SAMPLE_ITEMS = [
  {
    name: 'Classic Cheeseburger',
    category: 'Meals',
    price: 150,
    stock: 50,
    description: 'Juicy beef patty with melted cheese, lettuce, tomato',
    // imageUrl: '/uploads/burger.jpg'  // Add after uploading image
  },
  {
    name: 'Chicken Caesar Salad',
    category: 'Meals',
    price: 120,
    stock: 30,
    description: 'Fresh romaine lettuce with grilled chicken and Caesar dressing',
  },
  {
    name: 'Margherita Pizza',
    category: 'Meals',
    price: 200,
    stock: 25,
    description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
  },
  {
    name: 'Chocolate Chip Cookie',
    category: 'Snacks',
    price: 30,
    stock: 100,
    description: 'Freshly baked cookie with chocolate chips',
  },
  {
    name: 'Iced Coffee',
    category: 'Beverages',
    price: 80,
    stock: 60,
    description: 'Cold brew coffee served over ice',
  }
];

async function addSamples() {
  console.log('📝 Adding sample menu items...\n');

  const usingMongo = !!process.env.MONGO_URI;

  if (usingMongo) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  const menuRepo = RepositoryFactory.getMenuRepository();

  for (const item of SAMPLE_ITEMS) {
    try {
      const created = await menuRepo.create(item);
      console.log(`✅ Added: ${created.name} (₱${created.price}) - Stock: ${created.stock}`);
    } catch (err) {
      console.error(`❌ Failed to add ${item.name}:`, err.message);
    }
  }

  if (usingMongo) {
    await mongoose.connection.close();
  }

  console.log('\n✨ Done! Now add images through the admin panel.\n');
  console.log('📸 To add images:');
  console.log('   1. Login as admin');
  console.log('   2. Go to Menu Management');
  console.log('   3. Edit each item and upload a real food photo\n');
}

addSamples().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
